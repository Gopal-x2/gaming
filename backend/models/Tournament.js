const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a tournament title'],
      trim: true,
    },
    game: {
      type: String,
      required: [true, 'Please provide game name'],
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    },
    format: {
      type: String,
      enum: ['Solo', 'Duo', 'Squad', '5v5', 'Custom'],
      default: 'Squad',
    },
    teamSize: {
      type: Number,
      required: true,
      default: 4,
    },
    maxTeams: {
      type: Number,
      required: true,
      default: 16,
    },
    registeredTeamsCount: {
      type: Number,
      default: 0,
    },
    entryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    entryFeePerPlayer: {
      type: Number,
      default: 50,
    },
    feeType: {
      type: String,
      enum: ['PER_PLAYER', 'FLAT_TEAM'],
      default: 'PER_PLAYER',
    },
    prizePool: {
      type: Number,
      required: true,
      default: 1000,
    },
    description: {
      type: String,
      required: [true, 'Please add tournament description'],
    },
    rules: {
      type: String,
      default: '1. Play fair.\n2. No hacks or cheats allowed.\n3. Be present 15 mins before match time.',
    },
    organizer: {
      type: String,
      default: 'Nexus Esports Admin',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'REGISTRATION_OPEN',
        'REGISTRATION_CLOSED',
        'UPCOMING',
        'LIVE',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'DRAFT',
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    winners: {
      first: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      second: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      third: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tournament', TournamentSchema);
