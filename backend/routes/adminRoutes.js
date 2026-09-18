const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  permanentlyDeleteTournament,
  getAllPayments,
  verifyManualPayment,
  createMatch,
  updateMatch,
  updateResults,
  getAllTeams
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Protect all admin routes with protect + adminOnly
router.use(protect, adminOnly);

router.get('/dashboard-stats', getDashboardStats);
router.post('/tournaments', createTournament);
router.put('/tournaments/:id', updateTournament);
router.delete('/tournaments/:id', deleteTournament);
router.delete('/tournaments/:id/permanent', permanentlyDeleteTournament);

router.post('/matches', createMatch);
router.put('/matches/:id', updateMatch);

router.post('/results', updateResults);

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

router.get('/payments', getAllPayments);
router.put('/payments/:id/verify', verifyManualPayment);
router.get('/teams', getAllTeams);

module.exports = router;
