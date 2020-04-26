const Voting = require('../models/votingModel');
const Membership = require('../models/membershipModel');
const Ticket = require('../models/ticketModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { hasFields } = require('../utils/object');
const VotingContract = require('../utils/contract');
const {
  getAllDocuments,
  updateDocument,
  deleteDocument,
} = require('../utils/query');

const findVoting = async (id) => {
  const voting = await Voting.findById(id);
  if (!voting) throw new AppError('No voting with this ID', 404);
  return voting;
};

exports.getAllVotings = getAllDocuments(Voting);

exports.updateVoting = updateDocument(Voting, ['title', 'description']);

exports.deleteVoting = deleteDocument(Voting);

exports.checkConnection = catchAsync(async (req, res, next) => {
  const connected = await VotingContract.isConnected();
  if (!connected) return next(new AppError('Not connected to blockchain', 500));
  next();
});

exports.getVoting = catchAsync(async (req, res, next) => {
  const voting = await findVoting(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Successfull query',
    result: voting,
  });
});

exports.getVotingFromContract = catchAsync(async (req, res, next) => {
  const voting = await findVoting(req.params.id);

  const contract = await VotingContract.getContractInfo(voting.votingId);
  const voteResult = await VotingContract.totalVotesGiven(
    voting.votingId,
    voting.candidates
  );

  res.status(200).json({
    status: 'success',
    message: 'Successfull query',
    result: { ...contract, voteResult },
  });
});

exports.createVoting = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'title', 'description', 'candidates', 'endTime');
  const { title, description, candidates, endTime } = req.body;

  const result = await VotingContract.createVoting(candidates, endTime);
  const { votingId, adminToken, tx } = result;

  const voting = await Voting.create({
    title,
    description,
    votingId,
    candidates,
    endTime,
    createdBy: req.user.id,
    tx,
  });

  req.voting = voting;
  req.adminToken = adminToken;

  next();
});

exports.addGroupToVoting = catchAsync(async (req, res, next) => {
  const { group, id } = req.params;
  const filteredUsers = [];

  const voting = await findVoting(id);

  const isStarted = await VotingContract.votingStarted(voting.votingId);
  if (isStarted) return next(new AppError('Voting is already started', 400));

  const groupUsers = await Membership.find({ group }).populate('user').lean();

  // eslint-disable-next-line no-restricted-syntax
  for await (const user of groupUsers) {
    const ticket = await Ticket.findOne({ voting: id, user: user.user._id });
    if (!ticket)
      await filteredUsers.push({
        user: user.user._id,
        email: user.user.email,
        voting: id,
      });
  }

  if (!filteredUsers.length) {
    return next(
      new AppError('No more voters found to add to this voting', 404)
    );
  }

  const { result, tokens } = await VotingContract.addTokens(
    voting.votingId,
    req.body.adminToken,
    filteredUsers.length
  );

  req.users = filteredUsers;
  req.tokens = tokens;
  req.result = result;

  next();
});

exports.startVoting = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'token');
  const { token } = req.body;

  const voting = await findVoting(req.params.id);
  await VotingContract.startVoting(voting.votingId, token);
  await voting.updateOne({ isStarted: true });

  next();
});

exports.vote = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'candidate', 'token');
  const { candidate, token } = req.body;

  const voting = await findVoting(req.params.id);
  const vote = await VotingContract.vote(voting.votingId, candidate, token);

  res.status(200).json({
    status: 'success',
    message: 'Successfully voted',
    result: vote,
  });
});

exports.archiveVoting = catchAsync(async (req, res, next) => {
  const voting = await findVoting(req.params.id);
  await voting.updateOne({ isArchived: true }, { new: true });

  res.status(200).json({
    status: 'success',
    message: 'Voting archived',
    result: voting,
  });
});

exports.resetVotingSystem = catchAsync(async (req, res, next) => {
  await Voting.deleteMany();
  await Ticket.deleteMany();

  res.status(204).json({
    status: 'success',
    message: 'Voting deleted',
  });
});
