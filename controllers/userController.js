const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.search = catchAsync(async (req, res, next) => {
  const regeexp = new RegExp(req.query.query, 'i');

  const result = await User.find({
    $or: [{ name: { $regex: regeexp } }, { email: { $regex: regeexp } }],
  });

  res.status(200).json({
    status: 'success',
    data: { result },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('Користувача з таким id не існує'));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
  });
});
