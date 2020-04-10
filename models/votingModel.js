const mongoose = require('mongoose');

const votingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Введіть будь ласка назву голосування'],
  },
  description: {
    type: String,
    required: [true, 'Введіть будь ласка опис'],
  },
  votingId: {
    type: String,
    unique: true,
    required: [true, 'Вкажіть id голосування'],
  },
  candidates: {
    type: [String],
    required: [true, 'Вкажіть варіанти голосування'],
    validate: {
      validator: function (val) {
        return val.length >= 2;
      },
      message: 'Повинно бути як мінімум 2 варіанти голосування',
    },
  },
  endTime: {
    type: Date,
    required: [true, 'Вкажіть дату закінчення голосування'],
    validate: {
      validator: function (val) {
        return val > Date.now();
      },
      message: 'Виберіть дату в майбутньому',
    },
  },
  groups: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
    },
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tx: {
    type: String,
    required: [true, 'Голосування повинне мати транзакцію створення'],
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
});

const Voting = mongoose.model('Voting', votingSchema);

module.exports = Voting;
