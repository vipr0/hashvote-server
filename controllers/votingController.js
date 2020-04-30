const multer = require('multer');
const path = require('path');
const neatCsv = require('neat-csv');

const User = require('../models/userModel');
const Voting = require('../models/votingModel');
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

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (path.extname(file.originalname) === '.csv') {
    cb(null, true);
  } else {
    cb(new AppError('Not an .csv file! Please upload only csv', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

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

exports.uploadCSVFile = upload.single('file');

exports.addUsers = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file was uploaded'));
  }

  const voting = await findVoting(req.params.id);
  if (voting.isStarted)
    return next(new AppError('Voting is already started', 400));

  const csv = await neatCsv(req.file.buffer, { headers: ['email'] });
  const emails = csv.map((row) => row.email);
  if (!emails.length)
    return next(new AppError('No emails found, check your file', 400));

  const users = await User.find({ email: { $in: emails } });
  if (!users.length)
    return next(
      new AppError('No users found with those emails, check emails', 400)
    );

  const tickets = await Ticket.find({
    user: { $in: users.map((user) => user._id) },
    voting: req.params.id,
  });

  const filteredUsers = await User.find({
    email: { $in: emails },
    _id: { $nin: tickets.map((ticket) => ticket.user) },
  });

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
