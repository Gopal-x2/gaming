const express = require('express');
const router = express.Router();
const { getMatches, getLeaderboard } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to optionally extract user if token is sent
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getMatches);
router.get('/leaderboard/:tournamentId', getLeaderboard);

module.exports = router;
