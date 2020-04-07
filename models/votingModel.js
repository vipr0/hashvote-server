const mongoose = require('mongoose');
const validator = require('validator');

const votingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Введіть будь ласка назву голосування'],
  },
  description: {
    type: String,
    required: [true, 'Введіть будь ласка опис'],
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
  contractAddress: {
    type: String,
    unique: true,
    required: [true, 'Вкажіть адресу смартконтракта'],
    validate: [
      validator.isEthereumAddress,
      'Неправильна адреса смартконтракту',
    ],
  },
  endDate: {
    type: Date,
    required: [true, 'Вкажіть дату закінчення голосування'],
    validate: {
      validator: function (val) {
        return val > Date.now();
      },
      message: 'Виберіть дату в майбутньому',
    },
  },
  voters: {
    type: [String],
    required: [true, 'Вкажіть голосуючих'],
  },
});

const Voting = mongoose.model('Voting', votingSchema);

module.exports = Voting;
