const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: String,
      required: [true, 'Please specify the main game for this team'],
      enum: ['BGMI', 'Free Fire', 'Valorant', 'Counter-Strike', 'FIFA / EA FC', 'Call of Duty', 'PUBG', 'Other'],
      default: 'BGMI',
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        inGameId: {
          type: String,
          default: '',
        },
        inGameUsername: {
          type: String,
          default: '',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contactPhone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Team', TeamSchema);
