const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    rank: {
      type: Number,
      default: 0,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    kills: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    prizeWon: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
