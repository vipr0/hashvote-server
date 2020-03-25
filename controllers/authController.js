exports.protect = (req, res, next) => {
  console.log('Protected');

  next();
};
