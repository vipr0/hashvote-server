const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
      required: [true, 'Membership must belong to a group'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Membership must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

membershipSchema.index({ group: 1, user: 1 }, { unique: true });

const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
