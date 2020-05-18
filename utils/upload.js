const multer = require('multer');
const path = require('path');
const AppError = require('./AppError');

const multerStorage = multer.memoryStorage();

exports.csvFilter = (req, file, cb) => {
  if (path.extname(file.originalname) === '.csv') {
    cb(null, true);
  } else {
    cb(new AppError('Not an .csv file! Please upload only csv', 400), false);
  }
};

exports.uploadFile = (filter) =>
  multer({ storage: multerStorage, fileFilter: filter });
