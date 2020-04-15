const AppError = require('./AppError');

exports.filterObject = (obj, ...allowedFields) => {
  const newObj = {};

  // Filter object
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.hasFields = (obj, ...fields) => {
  // Check if allowed fields are not empty
  fields.forEach((field) => {
    if (!obj[field])
      throw new AppError('Перевірте чи всі поля були введені', 400);
  });
};
