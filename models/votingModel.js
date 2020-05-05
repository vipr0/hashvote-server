const mongoose = require('mongoose');

const votingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Voting title is required'],
    },
    description: {
      type: String,
      required: [true, 'Voting description is required'],
    },
    votingId: {
      type: String,
      unique: true,
      required: [true, 'Voting ID is required'],
    },
    candidates: {
      type: [String],
      required: [true, 'Candidates are required'],
      validate: {
        validator: function (val) {
          return val.length >= 2;
        },
        message: 'At leaset 2 candidates are required',
      },
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (val) {
          return val > Date.now();
        },
        message: 'End time must be in the future',
      },
    },
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
      required: [true, 'Voting must have transaction hash of creation'],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isStarted: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

votingSchema.virtual('voters', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'voting',
});

votingSchema.virtual('votersCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'voting',
  count: true,
});

votingSchema.pre('find', function () {
  this.populate({ path: 'votersCount' });
});

votingSchema.pre('findOne', function () {
  this.populate({
    path: 'voters',
    populate: {
      path: 'user',
      model: 'User',
    },
  });
});

const Voting = mongoose.model('Voting', votingSchema);

module.exports = Voting;
