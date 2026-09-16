const Team = require('../models/Team');
const TeamInvitation = require('../models/TeamInvitation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res, next) => {
  try {
    const { name, game, logo, contactPhone, captainInGameId, captainInGameUsername } = req.body;

    if (!name || !game) {
      return res.status(400).json({ success: false, message: 'Please provide team name and game' });
    }

    const team = await Team.create({
      name,
      game,
      logo: logo || undefined,
      contactPhone: contactPhone || req.user.phone,
      captain: req.user.id,
      members: [
        {
          user: req.user.id,
          inGameId: captainInGameId || '',
          inGameUsername: captainInGameUsername || req.user.username,
        },
      ],
    });

    const populatedTeam = await Team.findById(team._id).populate('captain members.user', 'name username email avatar');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's teams (where captain or member)
// @route   GET /api/teams/my
// @access  Private
exports.getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({
      $or: [{ captain: req.user.id }, { 'members.user': req.user.id }],
    }).populate('captain members.user', 'name username email avatar');

    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('captain members.user', 'name username email avatar phone');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite player to team
// @route   POST /api/teams/:id/invite
// @access  Private
exports.invitePlayer = async (req, res, next) => {
  try {
    const { inviteeId } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Only Captain can invite
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can invite members' });
    }

    // Check if invitee exists
    const invitee = await User.findById(inviteeId);
    if (!invitee) {
      return res.status(404).json({ success: false, message: 'Invitee user not found' });
    }

    // Check if user is already in team
    const isAlreadyMember = team.members.some((m) => m.user.toString() === inviteeId);
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this team' });
    }

    // Check if pending invitation exists
    const existingInvite = await TeamInvitation.findOne({
      team: teamId,
      invitee: inviteeId,
      status: 'PENDING',
    });

    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'An invitation has already been sent to this user' });
    }

    const invitation = await TeamInvitation.create({
      team: teamId,
      inviter: req.user.id,
      invitee: inviteeId,
      status: 'PENDING',
    });

    // Create Notification for Invitee
    await Notification.create({
      user: inviteeId,
      title: 'Team Invitation Received',
      message: `You have been invited to join team "${team.name}" by ${req.user.name}.`,
      type: 'TEAM_INVITATION',
      link: `/notifications.html`,
    });

    // Send Invitation Email
    sendEmail({
      to: invitee.email,
      subject: `Team Invitation: Join ${team.name} on Nexus Esports`,
      html: `<p>Hello ${invitee.name},</p><p>You have been invited by <strong>${req.user.name}</strong> to join team <strong>${team.name}</strong>.</p><p>Log into your account dashboard to ACCEPT or REJECT this invitation.</p>`,
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${invitee.name}`,
      invitation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's pending team invitations
// @route   GET /api/teams/invitations
// @access  Private
exports.getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await TeamInvitation.find({
      invitee: req.user.id,
      status: 'PENDING',
    }).populate('team inviter', 'name logo username email');

    res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to team invitation (ACCEPT / REJECT)
// @route   POST /api/teams/invitations/:id/respond
// @access  Private
exports.respondInvitation = async (req, res, next) => {
  try {
    const { action, inGameId, inGameUsername } = req.body; // action: ACCEPT or REJECT
    const invitationId = req.params.id;

    const invitation = await TeamInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this invitation' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Invitation has already been answered' });
    }

    if (action === 'ACCEPT') {
      const team = await Team.findById(invitation.team);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Team no longer exists' });
      }

      // Check duplicate member
      const isAlreadyMember = team.members.some((m) => m.user.toString() === req.user.id);
      if (!isAlreadyMember) {
        team.members.push({
          user: req.user.id,
          inGameId: inGameId || '',
          inGameUsername: inGameUsername || req.user.username,
        });
        await team.save();
      }

      invitation.status = 'ACCEPTED';
      await invitation.save();

      // Notify captain
      await Notification.create({
        user: team.captain,
        title: 'Invitation Accepted',
        message: `${req.user.name} accepted your invitation to join ${team.name}.`,
        type: 'TEAM_INVITATION',
      });

      return res.status(200).json({
        success: true,
        message: `Successfully joined ${team.name}!`,
      });
    } else {
      invitation.status = 'REJECTED';
      await invitation.save();

      return res.status(200).json({
        success: true,
        message: 'Invitation declined.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update team details (Captain Only)
// @route   PUT /api/teams/:id
// @access  Private (Captain Only)
exports.updateTeam = async (req, res, next) => {
  try {
    const { name, game, logo, contactPhone } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can edit team details' });
    }

    if (name) team.name = name;
    if (game) team.game = game;
    if (logo) team.logo = logo;
    if (contactPhone) team.contactPhone = contactPhone;

    await team.save();

    const updatedTeam = await Team.findById(team._id).populate('captain members.user', 'name username email avatar phone');

    res.status(200).json({
      success: true,
      message: 'Team details updated successfully!',
      team: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from team (Captain Only or Member Leaving)
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
  try {
    const { id: teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isCaptain = team.captain.toString() === req.user.id;
    const isSelf = req.user.id === userId;

    if (!isCaptain && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this player' });
    }

    if (userId === team.captain.toString()) {
      return res.status(400).json({ success: false, message: 'Captain cannot be removed from the team' });
    }

    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Player removed from team successfully!',
    });
  } catch (error) {
    next(error);
  }
};
