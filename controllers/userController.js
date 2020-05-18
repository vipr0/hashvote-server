const multer = require('multer');
const sharp = require('sharp');
const neatCsv = require('neat-csv');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { filterObject, hasFields } = require('../utils/object');
const { csvFilter, uploadFile } = require('../utils/upload');
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

exports.deleteManyUsers = catchAsync(async (req, res, next) => {
  const { users } = req.body;

  if (!users || !users.length)
    return next(new AppError('You must specify array of id`s of users'));

  await User.deleteMany({ _id: { $in: users } });
  res.status(204).json({ status: 'success', message: 'Succesfully deleted' });
});

exports.createUser = catchAsync(async (req, res, next) => {
  hasFields(req.body, 'name', 'email');
  const filteredBody = filterObject(req.body, 'name', 'email');

  const user = await User.create(filteredBody);
  const token = await user.createToken('registrationToken');
  await user.save({ validateBeforeSave: false });

  req.newUsers = [{ ...user._doc, token }];

  next();
});

exports.uploadUsersFile = uploadFile(csvFilter).single('file');

exports.createManyUsers = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file was uploaded'));

  const csv = await neatCsv(req.file.buffer, {
    headers: ['name', 'email'],
    separator: ';',
    mapValues: ({ value }) => value.trim(),
  });

  if (!csv.length)
    return next(new AppError('No users found, check your file', 400));

  if (!csv[0].name || !csv[0].email)
    return next(
      new AppError(
        'Invalid file structure. File must contain only name and email, separated by ;',
        400
      )
    );

  const createdUsers = [];
  const ignoredUsers = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const user of csv) {
    try {
      if (!(await User.findOne({ email: user.email }))) {
        const newUser = await User.create(user);
        const token = await newUser.createToken('registrationToken');
        await newUser.save({ validateBeforeSave: false });
        createdUsers.push({ ...newUser._doc, token });
      }
    } catch (error) {
      ignoredUsers.push(user);
    }
  }

  if (!createdUsers.length)
    return next(
      new AppError(
        'No new users have been created. It is possible that all users with these emails have already registered',
        400
      )
    );

  req.newUsers = createdUsers;
  req.ignoredUsers = ignoredUsers;

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

  await findUser(req.user.id);

  const user = await User.findByIdAndUpdate(req.user.id, filteredObject, {
    new: true,
    runValidators: true,
  });

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
    result: user,
  });
});
