const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
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
  if (!user) throw new AppError('No user with this ID', 404);
  return user;
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

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

  req.newUser = user;
  req.token = token;

  next();
});

exports.getMyData = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Your data was successfully received',
    result: req.user,
  });
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateMyData = catchAsync(async (req, res, next) => {
  const filteredObject = filterObject(req.body, 'email', 'photo', 'name');
  if (req.file) filteredObject.photo = req.file.filename;
  const user = await findUser(req.user.id);
  await user.updateOne(filteredObject, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Your data was successfully updated',
    result: user,
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'password', 'newPassword', 'newPasswordConfirm');
  const { password, newPassword, newPasswordConfirm } = req.body;

  if (newPassword !== newPasswordConfirm)
    return next(new AppError('New passwords are not the same', 400));

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect old password', 401));
  }

  user.password = newPassword;
  user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password successfully updated',
    data: { user },
  });
});
