const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const User = require('../models/User');
const Payment = require('../models/Payment');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Leaderboard = require('../models/Leaderboard');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

// @desc    Get Admin Dashboard Overview Statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin Only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeams = await Team.countDocuments();
    const activeTournaments = await Tournament.countDocuments({
      status: { $in: ['REGISTRATION_OPEN', 'UPCOMING', 'LIVE'] },
    });
    const completedTournaments = await Tournament.countDocuments({ status: 'COMPLETED' });
    const totalRegistrations = await TournamentRegistration.countDocuments({
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    const successfulPayments = await Payment.find({ status: 'SUCCESS' });
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    // Registration monthly analytics for Chart.js
    const registrations = await TournamentRegistration.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        activeTournaments,
        completedTournaments,
        totalRegistrations,
        successfulPaymentsCount: successfulPayments.length,
        totalRevenue,
        monthlyRegistrations: registrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= TOURNAMENT MANAGEMENT =================

// @desc    Create Tournament (ADMIN ONLY)
// @route   POST /api/admin/tournaments
// @access  Private (Admin Only)
exports.createTournament = async (req, res, next) => {
  try {
    const {
      title,
      game,
      banner,
      format,
      teamSize,
      maxTeams,
      entryFee,
      entryFeePerPlayer,
      feeType,
      prizePool,
      description,
      rules,
      organizer,
      status,
      registrationDeadline,
      startDate,
      endDate,
    } = req.body;

    if (!title || !game || !registrationDeadline || !startDate) {
      return res.status(400).json({ success: false, message: 'Please provide title, game, deadline, and start date' });
    }

    const perPlayerFee = entryFeePerPlayer !== undefined ? entryFeePerPlayer : 50;
    const calculatedFee = feeType === 'FLAT_TEAM' ? (entryFee || 0) : ((teamSize || 4) * perPlayerFee);

    const tournament = await Tournament.create({
      title,
      game,
      banner: banner || undefined,
      format: format || 'Squad',
      teamSize: teamSize || 4,
      maxTeams: maxTeams || 16,
      entryFee: calculatedFee,
      entryFeePerPlayer: perPlayerFee,
      feeType: feeType || 'PER_PLAYER',
      prizePool: prizePool || 1000,
      description: description || 'Official competitive tournament.',
      rules: rules || undefined,
      organizer: organizer || req.user.name,
      status: status || 'REGISTRATION_OPEN',
      registrationDeadline,
      startDate,
      endDate,
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit Tournament (ADMIN ONLY)
// @route   PUT /api/admin/tournaments/:id
// @access  Private (Admin Only)
exports.updateTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Tournament (ADMIN ONLY)
// @route   DELETE /api/admin/tournaments/:id
// @access  Private (Admin Only)
exports.deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    tournament.status = 'CANCELLED';
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament status updated to CANCELLED',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently Delete Tournament & Clean Records (ADMIN ONLY)
// @route   DELETE /api/admin/tournaments/:id/permanent
// @access  Private (Admin Only)
exports.permanentlyDeleteTournament = async (req, res, next) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Delete associated matches, registrations, and leaderboard records
    await Match.deleteMany({ tournament: tournamentId });
    await TournamentRegistration.deleteMany({ tournament: tournamentId });
    await Leaderboard.deleteMany({ tournament: tournamentId });

    // Permanently remove tournament document
    await Tournament.findByIdAndDelete(tournamentId);

    res.status(200).json({
      success: true,
      message: 'Tournament and associated match records permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// ================= MATCH & ROOM CREDENTIAL MANAGEMENT =================

// @desc    Create Match (ADMIN ONLY)
// @route   POST /api/admin/matches
// @access  Private (Admin Only)
exports.createMatch = async (req, res, next) => {
  try {
    const { tournamentId, roundName, matchNumber, teamIds, matchTime, roomId, roomPassword, isPublished } = req.body;

    if (!tournamentId || !matchNumber || !matchTime) {
      return res.status(400).json({ success: false, message: 'Please provide tournamentId, matchNumber, and matchTime' });
    }

    const match = await Match.create({
      tournament: tournamentId,
      roundName: roundName || 'Round 1',
      matchNumber,
      teams: teamIds || [],
      matchTime,
      roomId: roomId || '',
      roomPassword: roomPassword || '',
      isPublished: isPublished || false,
    });

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Match & Broadcast Room ID / Password (ADMIN ONLY)
// @route   PUT /api/admin/matches/:id
// @access  Private (Admin Only)
exports.updateMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const wasPublished = match.isPublished;
    Object.assign(match, req.body);
    await match.save();

    // If Room Info is published by Admin, send notifications & emails to registered captains
    if (match.isPublished && match.roomId) {
      const registrations = await TournamentRegistration.find({
        tournament: match.tournament,
        paymentStatus: { $in: ['SUCCESS', 'FREE'] },
      }).populate('captain', 'name email');

      const captainIds = registrations.map((r) => r.captain._id || r.captain);
      for (const reg of registrations) {
        if (reg.captain) {
          await Notification.create({
            user: reg.captain._id || reg.captain,
            title: '🔑 Match Room Password Published!',
            message: `Admin has shared Room ID & Password for Match #${match.matchNumber}. Room ID: ${match.roomId} | Password: ${match.roomPassword}`,
            type: 'ROOM_DETAILS',
            link: '/matches.html',
          });

          // Send Email to Captain
          if (reg.captain.email) {
            sendEmail({
              to: reg.captain.email,
              subject: `🔑 Match Room Credentials Released - Match #${match.matchNumber}`,
              html: `<h3>Match Room Credentials Released!</h3>
                <p>Hello ${reg.captain.name},</p>
                <p>Admin has published the room credentials for your match:</p>
                <p><strong>Room ID:</strong> ${match.roomId}</p>
                <p><strong>Password:</strong> ${match.roomPassword}</p>
                <p><strong>Match Time:</strong> ${new Date(match.matchTime).toLocaleString()}</p>
                <p>Please join the room 10 minutes before match start time.</p>`,
            });
          }
        }
      }
    }

    const populatedMatch = await Match.findById(match._id).populate('tournament', 'title game');

    // Generate quick copyable broadcast message for Admin
    const broadcastText = `🏆 TOURNAMENT ROOM CREDENTIALS 🏆\nTournament: ${populatedMatch.tournament ? populatedMatch.tournament.title : 'Esports Match'}\nMatch: ${match.roundName} (Match #${match.matchNumber})\n🎮 Room ID: ${match.roomId}\n🔑 Password: ${match.roomPassword}\n⏰ Match Time: ${new Date(match.matchTime).toLocaleString()}\n-----------------------------------\nJoin room 10 minutes prior to start!`;

    res.status(200).json({
      success: true,
      message: 'Room Credentials updated & broadcasted successfully!',
      match: populatedMatch,
      broadcastText,
    });
  } catch (error) {
    next(error);
  }
};

// ================= RESULTS & LEADERBOARD MANAGEMENT =================

// @desc    Update Leaderboard Scores & Finalize Winners (ADMIN ONLY)
// @route   POST /api/admin/results
// @access  Private (Admin Only)
exports.updateResults = async (req, res, next) => {
  try {
    const { tournamentId, results, winners } = req.body;
    // results: [{ teamId, rank, matchesPlayed, wins, kills, points, prizeWon }]
    // winners: { first: teamId, second: teamId, third: teamId }

    if (results && Array.isArray(results)) {
      for (const resItem of results) {
        await Leaderboard.findOneAndUpdate(
          { tournament: tournamentId, team: resItem.teamId },
          {
            rank: resItem.rank,
            matchesPlayed: resItem.matchesPlayed,
            wins: resItem.wins,
            kills: resItem.kills,
            points: resItem.points,
            prizeWon: resItem.prizeWon || 0,
          },
          { upsert: true, new: true }
        );
      }
    }

    if (winners) {
      const tournament = await Tournament.findById(tournamentId);
      if (tournament) {
        tournament.winners = winners;
        tournament.status = 'COMPLETED';
        await tournament.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tournament results and leaderboard updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ================= USER & PAYMENT MANAGEMENT =================

// @desc    Get All Users (ADMIN ONLY)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Status or Role (ADMIN ONLY)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin Only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Payments (ADMIN ONLY)
// @route   GET /api/admin/payments
// @access  Private (Admin Only)
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name username email')
      .populate('tournament team', 'title name game')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Registered Teams (ADMIN ONLY)
// @route   GET /api/admin/teams
// @access  Private (Admin Only)
exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('captain members.user', 'name username email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: teams.length, teams });
  } catch (error) {
    next(error);
  }
};
