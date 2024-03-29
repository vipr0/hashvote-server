const catchAsync = require('./catchAsync');
const AppError = require('./AppError');
const { filterObject, hasFields } = require('./object');

const findById = async (Model, id) => {
  const group = await Model.findById(id);
  if (!group) throw new AppError(`Invalid ID (${id})`, 404);
  return group;
};

exports.search = (Model, fields) =>
  catchAsync(async (req, res, next) => {
    const regeexp = new RegExp(req.query.query, 'i');
    const query = { $or: [] };
    fields.forEach((field) => {
      query.$or.push({ [field]: { $regex: regeexp } });
    });
    const result = await Model.find(query);

    res.status(200).json({
      status: 'success',
      message: 'Succesfull request',
      result,
    });
  });

exports.getAllDocuments = (Model) =>
  catchAsync(async (req, res, next) => {
    const result = await Model.find();

    res.status(200).json({
      status: 'success',
      message: 'Succesfull request',
      result,
    });
  });

exports.getDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    const result = await findById(Model, req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Succesfull request',
      result,
    });
  });

exports.createDocument = (Model, fields) =>
  catchAsync(async (req, res, next) => {
    hasFields(req.body, ...fields);
    const filteredBody = filterObject(req.body, ...fields);

    const result = await Model.create(filteredBody);
    res.status(201).json({
      status: 'success',
      message: 'Succesfully created',
      result,
    });
  });

exports.updateDocument = (Model, fields) =>
  catchAsync(async (req, res, next) => {
    const filteredBody = filterObject(req.body, ...fields);
    await findById(Model, req.params.id);

    const result = await Model.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Succesfully updated',
      result,
    });
  });

exports.deleteDocument = (Model, lastMiddleware = false) =>
  catchAsync(async (req, res, next) => {
    const result = await findById(Model, req.params.id);
    await result.remove();

    if (lastMiddleware) {
      res
        .status(204)
        .json({ status: 'success', message: 'Succesfully deleted' });
    } else {
      next();
    }
  });
