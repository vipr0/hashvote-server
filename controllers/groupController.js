const Group = require('../models/groupModel');
const Membership = require('../models/membershipModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const filterObject = require('../utils/filterObject');

exports.search = catchAsync(async (req, res, next) => {
  const regeexp = new RegExp(req.query.query, 'i');

  const result = await Group.find({ name: { $regex: regeexp } });

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { result },
  });
});

exports.getAllGroups = catchAsync(async (req, res, next) => {
  const groups = await Group.find().populate('groups');

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { groups },
  });
});

exports.getGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new AppError('Групи з таким id не існує', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Успішний запит',
    data: { group },
  });
});

exports.createGroup = catchAsync(async (req, res, next) => {
  const group = await Group.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Група створена',
    data: { group },
  });
});

exports.updateGroup = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, 'name', 'permissions');
  const group = await Group.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Група оновлена',
    data: { group },
  });
});

exports.deleteGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new AppError('Групи з таким id не існує', 404));
  }

  await Group.findByIdAndDelete(req.params.id);
  await Membership.deleteMany({ user: req.params.id });

  res.status(204).json({
    status: 'success',
    message: 'Група видалена',
  });
});
