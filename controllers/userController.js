const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('../utils/AppError');
const { filterObject, hasFields } = require('../utils/object');
const {
  search,
  getAllDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} = require('../utils/query');

const findUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('Користувача з таким id не існує', 404);
  return user;
};

exports.search = search(User, ['name', 'email', 'role']);

exports.getAllUsers = getAllDocuments(User);

exports.getUser = getDocument(User);

exports.updateUser = updateDocument(User, ['email', 'name', 'role', 'photo']);

exports.deleteUser = deleteDocument(User);

exports.createUser = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'name', 'email');
  const filteredBody = filterObject(req.body, 'name', 'email');
  const user = await User.create(filteredBody);
  const token = await user.createToken('registrationToken');
  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get('host')}/register/${token}`;
  new Email(user.email).sendWelcome({ name: user.name, url });

  res.status(201).json({
    status: 'success',
    message: 'Користувач створений',
    result: user,
  });
});

exports.updateMyData = catchAsync(async (req, res, next) => {
  const filteredObject = filterObject(req.body, 'email', 'photo', 'name');
  const user = await findUser(req.user.id);
  await user.updateOne(filteredObject, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Ваші дані успішно змінено',
    result: user,
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'password', 'newPassword', 'newPasswordConfirm');
  const { password, newPassword, newPasswordConfirm } = req.body;

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
