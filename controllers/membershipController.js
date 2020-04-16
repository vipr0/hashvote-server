const Group = require('../models/groupModel');
const Membership = require('../models/membershipModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { hasFields } = require('../utils/object');

exports.addMembership = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'group', 'user');
  const { group, user } = req.params;

  const groupDoc = await Group.findById(group);
  const userDoc = await User.findById(user);

  if (!userDoc) {
    return next(new AppError('Incorrect user ID', 404));
  }

  if (!groupDoc) {
    return next(new AppError('Incorrect group ID', 404));
  }

  await Membership.create({ group, user });

  res.status(200).json({
    status: 'success',
    message: 'User added to group',
  });
});

exports.removeMembership = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'group', 'user');
  const { user, group } = req.params;

  const result = await Membership.findOneAndDelete({ user, group });
  if (!result) return next(new AppError('Incorrect membership ID', 404));

  res.status(200).json({
    status: 'success',
    message: 'User removed from group',
  });
});

exports.removeMembershipsBy = (field) =>
  catchAsync(async (req, res, next) => {
    await Membership.deleteMany({ [field]: req.params.id });

    res.status(204).json({
      status: 'success',
      message: 'Succesfully deleted',
    });
  });
