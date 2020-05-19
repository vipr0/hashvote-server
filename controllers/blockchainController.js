const catchAsync = require('../utils/catchAsync');
const { isConnected } = require('../utils/web3Provider');
const AppError = require('../utils/AppError');

exports.checkConnection = catchAsync(async (req, res, next) => {
  const connected = await isConnected();
  if (!connected) return next(new AppError('Not connected to blockchain', 500));
  next();
});

exports.getWalletInfo = catchAsync(async (req, res, next) => {
  const result = await isConnected();

  res.status(200).json({
    status: 'succes',
    result,
  });
});
