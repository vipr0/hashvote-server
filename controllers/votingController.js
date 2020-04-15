const Voting = require('../models/votingModel');
const Membership = require('../models/membershipModel');
const Ticket = require('../models/ticketModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');
const { hasFields } = require('../utils/object');
const VotingContract = require('../utils/contract');
const {
  getAllDocuments,
  updateDocument,
  deleteDocument,
} = require('../utils/query');

const findVoting = async (id) => {
  const voting = await Voting.findById(id);
  if (!voting) throw new AppError('Такого голосування не існує', 404);
  return voting;
};

exports.getAllVotings = getAllDocuments(Voting);

exports.updateVoting = updateDocument(Voting, ['title', 'description']);

exports.deleteVoting = deleteDocument(Voting);

exports.getVoting = catchAsync(async (req, res, next) => {
  const voting = await findVoting(req.params.id);
  const contract = await VotingContract.getContractInfo(voting.votingId);
  const voteResult = await VotingContract.totalVotesGiven(
    voting.votingId,
    voting.candidates
  );

  res.status(200).json({
    status: 'success',
    message: 'Голосування знайдено',
    data: { voting, ...contract, voteResult },
  });
});

exports.createVoting = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'title', 'description', 'candidates', 'endTime');
  const { title, description, candidates, endTime } = req.body;

  // 2. Create new voting in smart contract with all voting tokens
  const result = await VotingContract.createVoting(candidates, endTime);
  const { votingId, adminToken, tx } = result;

  // 3. Create new voting in DB
  const voting = await Voting.create({
    title,
    description,
    votingId,
    candidates,
    endTime,
    createdBy: req.user.id,
    tx,
  });

  res.status(200).json({
    status: 'success',
    message: 'Нове голосування успішно створено',
    adminToken,
    data: { voting },
  });
});

exports.addGroupToVoting = catchAsync(async (req, res, next) => {
  const { group, id } = req.params;
  const filteredUsers = [];

  const voting = await findVoting(id);

  const isStarted = await VotingContract.votingStarted(voting.votingId);
  if (isStarted) return next(new AppError('Голосування вже розпочато', 400));

  const groupUsers = await Membership.find({ group }).populate('user').lean();

  // eslint-disable-next-line no-restricted-syntax
  for await (const user of groupUsers) {
    const ticket = await Ticket.findOne({ voting: id, user: user.user._id });
    if (!ticket) await filteredUsers.push(user);
  }

  const { result, tokens } = await VotingContract.addTokens(
    voting.votingId,
    req.body.adminToken,
    filteredUsers.length
  );

  if (!filteredUsers.length) {
    return next(
      new AppError('Не знайдено нових користувачів для додавання', 404)
    );
  }

  // eslint-disable-next-line no-restricted-syntax
  for await (const [i, user] of filteredUsers.entries()) {
    await Ticket.create({
      user: user.user._id,
      voting: id,
    });

    await new Email(user.user.email).sendVotingToken({
      token: tokens[i],
      url: 'localhost',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Групу додано до голосування',
    data: { result, tokens },
  });
});

exports.startVoting = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'token');
  const { token } = req.body;

  const voting = await findVoting(req.params.id);
  const result = await VotingContract.startVoting(voting.votingId, token);

  res.status(200).json({
    status: 'success',
    message: 'Голосування розпочато',
    data: { result },
  });
});

exports.vote = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'candidate', 'token');
  const { candidate, token } = req.body;

  const voting = await findVoting(req.params.id);
  const vote = await VotingContract.vote(voting.votingId, candidate, token);

  res.status(200).json({
    status: 'success',
    message: 'Успішно проголосовано',
    data: { vote },
  });
});

exports.archiveVoting = catchAsync(async (req, res, next) => {
  const voting = await findVoting(req.params.id);
  await voting.update({ isArchived: true }, { new: true });

  res.status(200).json({
    status: 'success',
    message: 'Голосування архівоване',
    data: { voting },
  });
});

exports.resetVotingSystem = catchAsync(async (req, res, next) => {
  await Voting.deleteMany();
  await Ticket.deleteMany();

  res.status(204).json({
    status: 'success',
    message: 'Голосування видалене',
  });
});
