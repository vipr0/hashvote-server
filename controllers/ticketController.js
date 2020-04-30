const Ticket = require('../models/ticketModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { hasFields } = require('../utils/object');

exports.createTickets = catchAsync(async (req, res, next) => {
  await Ticket.create(
    req.users.map((user) => ({ user: user._id, voting: req.params.id }))
  );
  next();
});

exports.removeTicket = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'voting', 'user');
  const { user, voting } = req.params;

  const result = await Ticket.findOneAndDelete({ user, voting });
  if (!result) return next(new AppError('No ticket with this ID', 404));

  res.status(200).json({
    status: 'success',
    message: 'Ticket deleted',
  });
});

exports.removeTicketsBy = (field) =>
  catchAsync(async (req, res, next) => {
    await Ticket.deleteMany({ [field]: req.params.id });

    res.status(204).json({
      status: 'success',
      message: 'Successfully deleted',
    });
  });
