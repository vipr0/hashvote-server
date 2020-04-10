const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    voting: {
      type: mongoose.Schema.ObjectId,
      ref: 'Voting',
      required: [true, 'Ticket must belong to a voting'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketSchema.index({ voting: 1, user: 1 }, { unique: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
