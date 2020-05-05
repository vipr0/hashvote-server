const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },
    role: {
      type: String,
      enum: ['admin', 'voter'],
      default: 'voter',
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      select: false,
    },
    registrationToken: String,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    passwordChangedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('votings', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'user',
});

userSchema.pre('findOne', function () {
  this.populate({
    path: 'votings',
    populate: {
      path: 'voting',
      model: 'Voting',
    },
  });
});

// Encrypt new password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
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

userSchema.methods.createToken = function (tokenName) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this[tokenName] = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Only for passwordResetToken
  if (tokenName === 'passwordResetToken')
    this.passwordResetTokenExpires = Date.now() + 24 * 60 * 1000; // 24 hours

  return resetToken;
};

userSchema.methods.resetTokenExpired = function (requestTime) {
  return requestTime > this.passwordResetTokenExpires;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
