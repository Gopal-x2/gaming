const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const TournamentRegistration = require('../models/TournamentRegistration');
const Notification = require('../models/Notification');
const { verifyRazorpaySignature } = require('../utils/razorpayHelper');
const { sendEmail } = require('../utils/emailService');

// @desc    Create Razorpay Order for Tournament Registration
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { tournamentId, teamId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only captain can initiate registration payment' });
    }

    // Check slot availability
    const count = await TournamentRegistration.countDocuments({
      tournament: tournamentId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    if (count >= tournament.maxTeams) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    // Check duplicate registration
    const existing = await TournamentRegistration.findOne({
      tournament: tournamentId,
      team: teamId,
      paymentStatus: { $in: ['SUCCESS', 'FREE'] },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Team already registered for this tournament' });
    }

    // Dynamic Fee Calculation: Fee Per Player * Player Count
    let perPlayerFee = tournament.entryFeePerPlayer !== undefined ? tournament.entryFeePerPlayer : 50;
    let totalFeeAmount = tournament.feeType === 'FLAT_TEAM' 
      ? tournament.entryFee 
      : (team.members.length * perPlayerFee);

    if (tournament.entryFee === 0 && tournament.entryFeePerPlayer === 0) {
      totalFeeAmount = 0;
    }

    // Free tournament flow
    if (totalFeeAmount === 0) {
      const regId = `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const registration = await TournamentRegistration.create({
        registrationId: regId,
        tournament: tournamentId,
        team: teamId,
        captain: req.user.id,
        paymentStatus: 'FREE',
      });

      tournament.registeredTeamsCount += 1;
      if (tournament.registeredTeamsCount >= tournament.maxTeams) {
        tournament.status = 'REGISTRATION_CLOSED';
      }
      await tournament.save();

      await Notification.create({
        user: req.user.id,
        title: 'Registration Successful',
        message: `Your team ${team.name} has registered for ${tournament.title}! Registration ID: ${regId}`,
        type: 'TOURNAMENT_REGISTRATION',
      });

      return res.status(200).json({
        success: true,
        freeRegistration: true,
        message: 'Successfully registered for free tournament!',
        registrationId: regId,
      });
    }

    // Paid tournament flow: Create Razorpay Order for calculated total amount
    let razorpayOrderId;
    const amountInPaisa = totalFeeAmount * 100;

    if (razorpay) {
      const options = {
        amount: amountInPaisa,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${teamId.slice(-4)}`,
      };
      const order = await razorpay.orders.create(options);
      razorpayOrderId = order.id;
    } else {
      // Test/Fallback Order ID
      razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    const payment = await Payment.create({
      razorpayOrderId,
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
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey12345',
      orderId: razorpayOrderId,
      amount: amountInPaisa,
      totalFeeAmount,
      perPlayerFee,
      playerCount: team.members.length,
      currency: 'INR',
      tournamentTitle: tournament.title,
      teamName: team.name,
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature and finalize registration
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      tournamentId,
      teamId,
    } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order ID' });
    }

    const isTestMode = !razorpayPaymentId || razorpayPaymentId.startsWith('pay_mock_');

    if (!isTestMode) {
      const isValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        process.env.RAZORPAY_KEY_SECRET
      );

      if (!isValid) {
        payment.status = 'FAILED';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
      }
    }

    payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    payment.razorpaySignature = razorpaySignature || 'mock_signature';
    payment.status = 'SUCCESS';
    await payment.save();

    const regId = `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const registration = await TournamentRegistration.create({
      registrationId: regId,
      tournament: tournamentId,
      team: teamId,
      captain: req.user.id,
      payment: payment._id,
      paymentStatus: 'SUCCESS',
    });

    const tournament = await Tournament.findById(tournamentId);
    if (tournament) {
      tournament.registeredTeamsCount += 1;
      if (tournament.registeredTeamsCount >= tournament.maxTeams) {
        tournament.status = 'REGISTRATION_CLOSED';
      }
      await tournament.save();
    }

    const team = await Team.findById(teamId);

    // Create Notification & Send Email
    await Notification.create({
      user: req.user.id,
      title: 'Payment & Registration Successful',
      message: `Payment of ₹${payment.amount} verified! Your team ${team ? team.name : ''} is registered. Reg ID: ${regId}`,
      type: 'PAYMENT_SUCCESS',
      link: '/my-tournaments.html',
    });

    sendEmail({
      to: req.user.email,
      subject: `Payment Receipt & Registration Confirmation - ${tournament ? tournament.title : 'Tournament'}`,
      html: `<h2>Registration Confirmed!</h2>
        <p>Dear ${req.user.name},</p>
        <p>Your payment of <strong>₹${payment.amount}</strong> has been successfully verified.</p>
        <p><strong>Registration ID:</strong> ${regId}</p>
        <p><strong>Tournament:</strong> ${tournament ? tournament.title : ''}</p>
        <p><strong>Team:</strong> ${team ? team.name : ''}</p>
        <p>Check your dashboard for match schedules and room details.</p>`,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and tournament registration completed successfully!',
      registrationId: regId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get User Payment History
// @route   GET /api/payments/my
// @access  Private
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('tournament team', 'title name game')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
};
