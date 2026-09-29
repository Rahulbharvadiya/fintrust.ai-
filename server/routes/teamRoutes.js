// Team Formation, Collaboration & Matchmaking Hub Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const teamService = require('../services/teamService');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');

// 1. "Looking for Team" & Team Showcase Directory
router.get('/directory', optionalToken, async (req, res) => {
  try {
    const { track, missingSkill, hasOpenings, limit, offset } = req.query;
    const result = await db.findTeams({
      track,
      missingSkill,
      hasOpenings: hasOpenings !== undefined ? hasOpenings === 'true' : true,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.json({
      success: true,
      total: result.total,
      teams: result.teams
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create New Team
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, track, maxMembers, lookingForSkills, pitchSummary, discordWebhookUrl, slackWebhookUrl } = req.body;
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Team name must be at least 3 characters.' });
    }

    const team = await teamService.createTeam({
      name: name.trim(),
      track: track || 'AI/ML & Automation',
      leaderId: req.user.id,
      maxMembers: maxMembers ? parseInt(maxMembers, 10) : 4,
      lookingForSkills: Array.isArray(lookingForSkills) ? lookingForSkills : [],
      pitchSummary: pitchSummary || '',
      discordWebhookUrl,
      slackWebhookUrl
    });

    res.status(201).json({
      success: true,
      message: `Team "${team.name}" created successfully! Invite code: ${team.invite_code}`,
      team
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Get Team Details by ID
router.get('/:id', optionalToken, async (req, res) => {
  try {
    const team = await db.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    const members = db.getTeamMembers(team.id);
    const submission = await db.getSubmissionByTeamId(team.id);

    res.json({
      success: true,
      team: {
        ...team,
        members,
        submission: submission || null,
        openSpots: Math.max(0, team.max_members - team.current_members_count)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Join Team with Secret Invite Code
router.post('/join', verifyToken, async (req, res) => {
  try {
    const { inviteCode, roleInTeam } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Secret invite code is required.' });
    }

    const result = await teamService.joinTeamWithInviteCode({
      inviteCode: inviteCode.trim(),
      userId: req.user.id,
      roleInTeam: roleInTeam || 'FULLSTACK'
    });

    res.json({
      success: true,
      message: `Welcome aboard! You have joined team "${result.team.name}".`,
      team: result.team
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Leave Team
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const result = await db.removeMemberFromTeam({
      teamId: req.params.id,
      userId: req.user.id
    });
    res.json({
      success: true,
      message: 'You have left the team.'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Send Team Invite or Direct Join Request
router.post('/:id/invites', verifyToken, async (req, res) => {
  try {
    const { targetUserId, type, message } = req.body; // type: 'INVITE' or 'REQUEST'
    const entry = await db.createInviteOrRequest({
      teamId: req.params.id,
      userId: targetUserId || req.user.id,
      type: type || 'REQUEST',
      message
    });

    res.status(201).json({
      success: true,
      message: `${type === 'INVITE' ? 'Invite' : 'Join request'} dispatched successfully.`,
      invite: entry
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Accept or Reject Invite / Request
router.put('/invites/:inviteId', verifyToken, async (req, res) => {
  try {
    const { action } = req.body; // 'ACCEPTED' or 'REJECTED'
    if (action !== 'ACCEPTED' && action !== 'REJECTED') {
      return res.status(400).json({ success: false, error: 'Action must be ACCEPTED or REJECTED.' });
    }

    const updated = await db.respondToInviteOrRequest(req.params.inviteId, action);
    res.json({
      success: true,
      message: `Invite/Request updated to ${action}`,
      entry: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Test Discord / Slack Webhook Provisioning
router.post('/:id/test-webhook', verifyToken, async (req, res) => {
  try {
    const team = await db.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const results = await teamService.notifyWebhooks({
      team,
      eventType: 'TEST_PING',
      actorName: req.user.full_name
    });

    res.json({
      success: true,
      message: 'Webhook test executed.',
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
