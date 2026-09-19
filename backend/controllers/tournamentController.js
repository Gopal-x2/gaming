const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Team = require('../models/Team');

// @desc    Get all tournaments with filtering and sorting
// @route   GET /api/tournaments
// @access  Public
exports.getTournaments = async (req, res, next) => {
  try {
    const { search, game, status, format, sortBy } = req.query;

    let query = {};

    // Filter out DRAFT for non-admins if status is not explicitly requested
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'DRAFT' };
    }

    if (game) {
      query.game = game;
    }

    if (format) {
      query.format = format;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'fee_low') sortOption = { entryFee: 1 };
    if (sortBy === 'fee_high') sortOption = { entryFee: -1 };
    if (sortBy === 'prize_high') sortOption = { prizePool: -1 };
    if (sortBy === 'date') sortOption = { startDate: 1 };

    const tournaments = await Tournament.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tournament details
// @route   GET /api/tournaments/:id
// @access  Public
exports.getTournamentById = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('winners.first winners.second winners.third', 'name logo');

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Get registered teams count
    const registeredCount = await TournamentRegistration.countDocuments({
      tournament: tournament._id,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    const registeredTeams = await TournamentRegistration.find({
      tournament: tournament._id,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    }).populate('team', 'name logo captain members');

    res.status(200).json({
      success: true,
      tournament: {
        ...tournament.toObject(),
        registeredTeamsCount: registeredCount,
        slotsLeft: Math.max(0, tournament.maxTeams - registeredCount),
      },
      registeredTeams,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check registration eligibility for user's team
// @route   POST /api/tournaments/:id/check-eligibility
// @access  Private
exports.checkEligibility = async (req, res, next) => {
  try {
    const { teamId } = req.body;
    const tournamentId = req.params.id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ success: false, message: `Registration is currently ${tournament.status.replace('_', ' ')}` });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Tournament registration deadline has passed' });
    }

    const currentRegistrations = await TournamentRegistration.countDocuments({
      tournament: tournamentId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    if (currentRegistrations >= tournament.maxTeams) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can register the team for tournaments' });
    }

    if (team.members.length < tournament.teamSize) {
      return res.status(400).json({
        success: false,
        message: `Team requires at least ${tournament.teamSize} members. Current: ${team.members.length}`,
      });
    }

    // Check if team is already registered
    const existingRegistration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      team: teamId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'This team is already registered for this tournament' });
    }

    // Check if any member of this team is already in another registered team for this tournament
    const teamMemberIds = team.members.map((m) => m.user.toString());
    const allRegistrations = await TournamentRegistration.find({
      tournament: tournamentId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    }).populate('team');

    for (const reg of allRegistrations) {
      if (reg.team && reg.team.members) {
        const otherMembers = reg.team.members.map((m) => m.user.toString());
        const conflict = teamMemberIds.some((id) => otherMembers.includes(id));
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `One of your team members is already registered with another team in this tournament`,
          });
        }
      }
    }

    // Calculate dynamic entry fee
    let perPlayerFee = tournament.entryFeePerPlayer !== undefined ? tournament.entryFeePerPlayer : 50;
    let calculatedTotal = tournament.feeType === 'FLAT_TEAM' 
      ? tournament.entryFee 
      : (team.members.length * perPlayerFee);

    if (tournament.entryFee === 0 && tournament.entryFeePerPlayer === 0) {
      calculatedTotal = 0;
    }

    res.status(200).json({
      success: true,
      eligible: true,
      feeType: tournament.feeType || 'PER_PLAYER',
      entryFeePerPlayer: perPlayerFee,
      playerCount: team.members.length,
      calculatedTotal,
      tournamentTitle: tournament.title,
    });
  } catch (error) {
    next(error);
  }
};
