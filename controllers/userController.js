const crypto = require('crypto');
const User = require('../models/userModel');
const Membership = require('../models/membershipModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('../utils/AppError');
const filterObject = require('../utils/filterObject');

const findUser = async (id, next) => {
  const user = await User.findById(id);
  if (!user) return next(new AppError('Користувача з таким id не існує', 404));
  return user;
};

exports.search = catchAsync(async (req, res, next) => {
  const regeexp = new RegExp(req.query.query, 'i');

  const result = await User.find({
    $or: [
      { name: { $regex: regeexp } },
      { email: { $regex: regeexp } },
      { role: { $regex: regeexp } },
    ],
  });

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { result },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await findUser(req.params.id, next);

  res.status(200).json({
    status: 'success',
    message: 'Користувача знайдено',
    data: { user },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const filteredBody = filterObject(req.body, 'name', 'email');
  filteredBody.registrationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.create(filteredBody);

  const url = `${req.protocol}://${req.get('host')}/register/${token}`;
  new Email(user.email).sendWelcome({ name: user.name, url });

  res.status(201).json({
    status: 'success',
    message: 'Користувач створений',
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, 'email', 'name', 'role', 'photo');

  const user = await findUser(req.params.id, next);
  await user.update(filteredBody, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Користувач оновлений',
    data: { user },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await findUser(req.params.id, next);
  await user.remove();
  await Membership.deleteMany({ user: req.params.id });

  res.status(204).json({
    status: 'success',
    message: 'Користувач видалений',
  });
});

exports.updateMyData = catchAsync(async (req, res, next) => {
  const filteredObject = filterObject(req.body, 'email', 'photo', 'name');
  const user = await findUser(req.user.id, next);
  await user.update(filteredObject, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Ваші дані успішно змінено',
    data: { user },
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;

  if (!password || !newPassword || !newPasswordConfirm)
    return next(new AppError('Перевірте чи всі поля заповнені', 400));

  if (newPassword !== newPasswordConfirm)
    return next(new AppError('Нові паролі не співпадають', 400));

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Неправильний старий пароль.', 401));
  }

  user.password = newPassword;
  user.save();

  res.status(200).json({
    status: 'success',
    message: 'Пароль успішно змінено',
    data: { user },
  });
});
