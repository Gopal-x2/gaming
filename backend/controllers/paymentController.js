const Payment = require('../models/Payment');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const TournamentRegistration = require('../models/TournamentRegistration');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

exports.createOrder = async (req, res, next) => {
  try {
    const { tournamentId, teamId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only captain can initiate registration payment' });
    }

    const count = await TournamentRegistration.countDocuments({
      tournament: tournamentId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    if (count >= tournament.maxTeams) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    const existing = await TournamentRegistration.findOne({
      tournament: tournamentId,
      team: teamId,
      paymentStatus: { $in: ['SUCCESS', 'FREE', 'PENDING'] },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Team already registered or pending verification' });
    }

    let perPlayerFee = tournament.entryFeePerPlayer !== undefined ? tournament.entryFeePerPlayer : 50;
    let totalFeeAmount = tournament.feeType === 'FLAT_TEAM' 
      ? tournament.entryFee 
      : (team.members.length * perPlayerFee);

    if (tournament.entryFee === 0 && tournament.entryFeePerPlayer === 0) {
      totalFeeAmount = 0;
    }

    if (totalFeeAmount === 0) {
      const regId = `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await TournamentRegistration.create({
        registrationId: regId,
        tournament: tournamentId,
        team: teamId,
        captain: req.user.id,
        paymentStatus: 'FREE',
      });

      tournament.registeredTeamsCount += 1;
      if (tournament.registeredTeamsCount >= tournament.maxTeams) tournament.status = 'REGISTRATION_CLOSED';
      await tournament.save();

      await Notification.create({
        user: req.user.id,
        title: 'Registration Successful',
        message: `Your team ${team.name} has registered for ${tournament.title}!`,
        type: 'TOURNAMENT_REGISTRATION',
      });

      return res.status(200).json({
        success: true,
        freeRegistration: true,
        message: 'Successfully registered for free tournament!',
      });
    }

    // Manual UPI Flow
    const payment = await Payment.create({
      user: req.user.id,
      tournament: tournamentId,
      team: teamId,
      amount: totalFeeAmount,
      currency: 'INR',
      status: 'CREATED',
    });

    res.status(200).json({
      success: true,
      freeRegistration: false,
      amount: totalFeeAmount,
      paymentId: payment._id,
      upiId: 'nexusgaming@upi', // Admin's UPI ID (Placeholder)
    });
  } catch (error) {
    next(error);
  }
};

exports.submitUpiPayment = async (req, res, next) => {
  try {
    const { paymentId, utrNumber, tournamentId, teamId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    payment.utrNumber = utrNumber;
    payment.status = 'PENDING';
    await payment.save();

    const regId = `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await TournamentRegistration.create({
      registrationId: regId,
      tournament: tournamentId,
      team: teamId,
      captain: req.user.id,
      payment: payment._id,
      paymentStatus: 'PENDING',
    });

    await Notification.create({
      user: req.user.id,
      title: 'Payment Verification Pending',
      message: `Your payment of ₹${payment.amount} (UTR: ${utrNumber}) is under review. Your registration is pending verification.`,
      type: 'PAYMENT_PENDING',
    });

    res.status(200).json({
      success: true,
      message: 'Payment details submitted! Registration will be confirmed once admin verifies the payment.',
      registrationId: regId,
    });
  } catch (error) {
    next(error);
  }
};

// Kept verifyPayment so it doesn't break routing if anyone calls it, but we won't use it.
exports.verifyPayment = async (req, res, next) => { res.status(400).json({success:false, message: "Use Manual UPI"}); };

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('tournament team', 'title name game')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
