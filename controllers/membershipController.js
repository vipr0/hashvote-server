const Group = require('../models/groupModel');
const Membership = require('../models/membershipModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.addMembership = catchAsync(async (req, res, next) => {
  const { group, user } = req.params;

  const groupDoc = await Group.findById(group);
  const userDoc = await User.findById(user);

  if (!userDoc) {
    return next(new AppError('Неправильний id користувача', 404));
  }

  if (!groupDoc) {
    return next(new AppError('Неправильний id групи', 404));
  }

  await Membership.create({ group, user });

  res.status(200).json({
    status: 'success',
    message: 'Користувача додано в групу',
  });
});

exports.removeMembership = catchAsync(async (req, res, next) => {
  const { user, group } = req.params;
  await Membership.findOneAndDelete({ user, group });

  res.status(200).json({
    status: 'success',
    message: 'Користувача видалено з групи',
  });
});
