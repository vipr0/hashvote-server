const Ticket = require('../models/ticketModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

exports.sendVotingTokens = catchAsync(async (req, res, next) => {
  const { users, tokens, result } = req;

  users.forEach(async (user, i) => {
    await Email.sendVotingToken(user.email, req.params.id, tokens[i]);
  });

  res.status(200).json({
    status: 'success',
    message: 'Successfuly added group to voting',
    result,
  });
});

exports.sendVotingStarted = catchAsync(async (req, res, next) => {
  const tickets = await Ticket.find({ voting: req.params.id }).populate('user');

  tickets.map(async (ticket) => {
    await Email.sendVotingStarted(ticket.user.email, req.params.id);
  });

  res.status(200).json({
    status: 'success',
    message: 'Voting started',
  });
});

exports.sendAdminToken = catchAsync(async (req, res, next) => {
  await Email.sendAdminToken(req.user.email, req.voting._id, req.adminToken);

  res.status(200).json({
    status: 'success',
    message: 'Successfully created new voting',
    adminToken: req.adminToken,
    result: req.voting,
  });
});

exports.sendResetPassword = catchAsync(async (req, res, next) => {
  await Email.sendResetPassword(req.body.email, req.token);

  res.status(200).json({
    status: 'success',
    message: 'We`ll email you a reset link',
  });
});

exports.sendFinishRegistration = catchAsync(async (req, res, next) => {
  await Email.sendFinishRegistration(req.newUser.email, req.token);

  res.status(201).json({
    status: 'success',
    message: 'User created',
    result: req.newUser,
  });
});
