const catchAsync = require('../utils/catchAsync');
const {
  isConnected,
  getWallets,
  getAccountBalance,
} = require('../utils/web3Provider');
const { getContractAddress } = require('../utils/contract');
const AppError = require('../utils/AppError');

exports.checkConnection = catchAsync(async (req, res, next) => {
  const connected = await isConnected();
  if (!connected) return next(new AppError('Not connected to blockchain', 500));
  next();
});

exports.getWalletInfo = catchAsync(async (req, res, next) => {
  const account = (await getWallets())[0];
  const balance = await getAccountBalance(account);

  res.status(200).json({
    status: 'succes',
    result: { account, balance },
  });
});

exports.getContractInfo = catchAsync(async (req, res, next) => {
  const address = await getContractAddress();

  res.status(200).json({
    status: 'succes',
    result: { address },
  });
});
