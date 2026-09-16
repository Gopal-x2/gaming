const Match = require('../models/Match');
const Team = require('../models/Team');
const TournamentRegistration = require('../models/TournamentRegistration');
const Leaderboard = require('../models/Leaderboard');

// @desc    Get matches (filtered by tournamentId or user's teams)
// @route   GET /api/matches
// @access  Public (Optional Protect to check admin status)
exports.getMatches = async (req, res, next) => {
  try {
    const { tournamentId, myMatches } = req.query;

    let query = {};
    if (tournamentId) {
      query.tournament = tournamentId;
    }

    let matches = await Match.find(query)
      .populate('tournament', 'title game banner status')
      .populate('teams', 'name logo captain')
      .sort({ matchTime: 1 });

    const isAdmin = req.user && req.user.role === 'ADMIN';

    // Mask Room ID & Password if not published and not Admin
    const sanitizedMatches = matches.map((m) => {
      const matchObj = m.toObject();
      if (!isAdmin && !matchObj.isPublished) {
        delete matchObj.roomId;
        delete matchObj.roomPassword;
      }
      return matchObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedMatches.length,
      matches: sanitizedMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament leaderboard
// @route   GET /api/matches/leaderboard/:tournamentId
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    let standings = await Leaderboard.find({ tournament: tournamentId })
      .populate('team', 'name logo captain')
      .sort({ points: -1, kills: -1, wins: -1 });

    // If no leaderboard entries exist yet, auto-populate from registered teams
    if (standings.length === 0) {
      const registrations = await TournamentRegistration.find({
        tournament: tournamentId,
        paymentStatus: { $in: ['SUCCESS', 'FREE'] },
      }).populate('team', 'name logo captain');

      for (let i = 0; i < registrations.length; i++) {
        if (registrations[i].team) {
          await Leaderboard.create({
            tournament: tournamentId,
            team: registrations[i].team._id,
            rank: i + 1,
            matchesPlayed: 0,
            wins: 0,
            kills: 0,
            points: 0,
          });
        }
      }

      standings = await Leaderboard.find({ tournament: tournamentId })
        .populate('team', 'name logo captain')
        .sort({ points: -1, kills: -1 });
    }

    res.status(200).json({
      success: true,
      leaderboard: standings,
    });
  } catch (error) {
    next(error);
  }
};
