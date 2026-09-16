const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeamById,
  invitePlayer,
  getMyInvitations,
  respondInvitation,
  updateTeam,
  removeMember,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTeam);
router.get('/my', protect, getMyTeams);
router.get('/invitations', protect, getMyInvitations);
router.get('/:id', protect, getTeamById);
router.put('/:id', protect, updateTeam);
router.post('/:id/invite', protect, invitePlayer);
router.delete('/:id/members/:userId', protect, removeMember);
router.post('/invitations/:id/respond', protect, respondInvitation);

module.exports = router;
