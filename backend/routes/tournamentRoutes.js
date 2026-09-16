const express = require('express');
const router = express.Router();
const {
  getTournaments,
  getTournamentById,
  checkEligibility,
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.post('/:id/check-eligibility', protect, checkEligibility);

module.exports = router;
