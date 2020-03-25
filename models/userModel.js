const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Введіть будь-ласка своє ім`я'],
  },
  role: {
    type: String,
    enum: ['admin', 'registar', 'voter'],
    default: 'voter',
  },
  email: {
    type: String,
    required: [true, 'Введіть будь-ласка свій email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Введіть будь-ласка правильний email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Введіть будь-ласка пароль'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Паролі не співпадають',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  passwordResetTokenExpires: Date,
  verificationToken: String,
});

// Hash new password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Check if candidate password and actual password are the same
userSchema.methods.correctPassword = async (password, userPassword) => {
  return await bcrypt.compare(password, userPassword);
};

userSchema.methods.changedPassword = (tokenExpires) => {
  return tokenExpires < this.passwordChangedAt;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Reset token will be valid for 24 hours
  this.passwordResetTokenExpires = Date.now() + 24 * 60 * 1000;

  return resetToken;
};

userSchema.methods.resetTokenExpired = function (requestTime) {
  return requestTime > this.passwordResetTokenExpires;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
