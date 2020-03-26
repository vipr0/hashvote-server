const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Email = require('../utils/email');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN,
} = require('../config');

const signTokenAndSend = (user, req, res) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    // How many days token will be valid
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
  });

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Успішно авторизовано',
    token,
    data: { user },
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];

  if (!token)
    return next(
      new AppError('Ви не авторизовані. Авторизуйтесь щоб отримати доступ', 401)
    );

  const decoded = await jwt.decode(token, JWT_SECRET);

  if (!decoded)
    return next(new AppError('Неправильний токен. Авторизутесь заново', 401));

  const user = await User.findById(decoded.id);

  if (!user)
    return next(
      new AppError('Користувача для цього токена більше не існує', 401)
    );

  if (user.changedPassword(decoded.iat))
    return next(new AppError('Ваш пароль змінено. Авторизуйтесь заново', 401));

  req.user = user;

  next();
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Вкажіть будь ласка свою пошту та пароль'));

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Користувача з такою поштою немає'));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Неправильний пароль.'));
  }

  if (!user.isVerified) {
    return next(
      new AppError('Користувач не підтвердив свою електронну пошту.')
    );
  }

  signTokenAndSend(user, req, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.create({
    ...req.body,
    role: 'voter',
    isVerified: false,
    verificationToken: hashedToken,
  });

  const url = `${req.protocol}://${req.get('host')}/verify/${token}`;
  new Email(user.email).sendWelcome({ name: user.name, url });

  res.status(200).json({
    status: 'success',
    message:
      'Успішно зареєстровано. Підтвердіть свою пошту за посиланням у відправленому листі',
  });
});

exports.verifyAccount = catchAsync(async (req, res, next) => {
  const verificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ verificationToken });

  if (!user) {
    return next(
      new AppError(
        'Неправильний або застарілий код підтвердження. Спробуйте ще раз',
        400
      )
    );
  }

  user.isVerified = true;
  user.verificationToken = undefined;

  await user.save({ validateBeforeSave: false });

  signTokenAndSend(user, req, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('Користувача з такою поштою не існує.', 400));

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get('host')}/verify/${token}`;
  new Email(user.email).sendResetPassword({ name: user.name, url });

  res.status(200).json({
    status: 'success',
    message: 'Посилання на відновлення відправлено на Вашу пошту.',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ passwordResetToken });

  if (req.body.password !== req.body.passwordConfirm)
    return next(new AppError('Введені паролі не співпадають', 400));
  if (!user) return next(new AppError('Неправильний код відновлення', 400));
  if (user.resetTokenExpired(Date.now()))
    return next(
      new AppError(
        'Час коду відновлення вийшов. Спробуйте відновити пароль ще раз',
        400
      )
    );

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  signTokenAndSend(user, req, res);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('У вас недостатньо прав для виконання цієї операції', 403)
      );

    next();
  };
};
