const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter group name'],
    },
    hostedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

groupSchema.virtual('members', {
  ref: 'Membership',
  foreignField: 'group',
  localField: '_id',
});

groupSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'members',
    select: 'user -group',
    populate: { path: 'user', select: 'photo name email' },
  });
  next();
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
