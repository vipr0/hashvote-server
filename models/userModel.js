const mongoose = require('mongoose');
const validator = require('validator');

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
  verificationToken: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
