const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.search = catchAsync(async (req, res, next) => {
  const regeexp = new RegExp(req.query.query, 'i');

  const result = await User.find({
    $or: [{ name: { $regex: regeexp } }, { email: { $regex: regeexp } }],
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
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('Користувача з таким id не існує'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Користувача знайдено',
    data: { user },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Користувач створений',
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
    message: 'Користувач оновлений',
    data: { user: updatedUser },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Користувач видалений',
  });
});

exports.updateProfileData = catchAsync(async (req, res, next) => {
  const filteredObject = filterObject(req.body, 'email', 'photo', 'name');
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredObject,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Ваші дані успішно змінено',
    data: { user: updatedUser },
  });
});

exports.updateProfilePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;
  if (!password || !newPassword || !newPasswordConfirm)
    return next(
      new AppError(
        'Будь перевірте чи всі данні були введені (актуальний пароль та новий пароль двічі)',
        400
      )
    );

  if (newPassword !== newPasswordConfirm)
    return next(new AppError('Нові паролі не співпадають', 400));

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(password, user.password))) {
    return next(
      new AppError(
        'Неправильний пароль. Перевірте введений пароль і спробйте ще раз',
        401
      )
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  user.save();

  res.status(200).json({
    status: 'success',
    message: 'Пароль успішно змінено',
    data: { user },
  });
});
