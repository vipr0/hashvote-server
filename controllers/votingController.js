const crypto = require('crypto');
const Voting = require('../models/votingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');
const filterObject = require('../utils/filterObject');

exports.getAllVotings = catchAsync(async (req, res, next) => {
  const votings = await Voting.find();

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { votings },
  });
});

exports.getVoting = catchAsync(async (req, res, next) => {
  const voting = await Voting.findById(req.params.id);

  if (!voting) {
    return next(new AppError('Такого голосування не існує', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'Голосування знайдено',
    data: { voting },
  });
});

exports.createVoting = catchAsync(async (req, res, next) => {
  const { voters } = req.body;
  if (!voters || !Array.isArray(voters)) {
    return next(new AppError('Неправильно вказані голосуючі', 400));
  }
  if (voters.length <= 2) {
    return next(new AppError('Повинно бути як мінімум 3 голосуючих.', 400));
  }

  // 1. Create voting tokens for every voter
  const votingTokens = [];
  voters.forEach(() => {
    votingTokens.push(crypto.randomBytes(32).toString('hex'));
  });

  // 2. Deploy new smart contract with all voting tokens
  // TODO

  // 3. Create new voting in DB
  const voting = await Voting.create(req.body);

  // 4. Send email with voting token to every voter
  voters.forEach(async (email, index) => {
    new Email(email).sendVotingToken({
      token: votingTokens[index],
      url: 'localhost',
    });
  });

  res.status(200).json({
    status: 'success',
    message: 'Нове голосування успішно створено',
    data: { voting },
  });
});

exports.updateVoting = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, 'title', 'description');

  const updatedVoting = await Voting.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Голосування успішно оновлено',
    data: { voting: updatedVoting },
  });
});

exports.deleteVoting = catchAsync(async (req, res, next) => {
  const voting = await Voting.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Deleted voting',
    data: { voting },
  });
});
