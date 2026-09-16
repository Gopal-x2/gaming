const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    roundName: {
      type: String,
      default: 'Round 1',
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    matchTime: {
      type: Date,
      required: true,
    },
    roomId: {
      type: String,
      default: '',
    },
    roomPassword: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Match', MatchSchema);
