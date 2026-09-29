// Authentication & Social Developer Integration Routes
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { verifyToken } = require('../middleware/authMiddleware');
const db = require('../db/databaseAdapter');

// 1. User Registration with Role and Skill Graph
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      full_name,
      affiliation,
      skills,
      track_preference,
      dietary_requirements,
      accessibility_needs,
      github_username,
      portfolio_url,
      bio
    } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ success: false, error: 'Email and full name are required.' });
    }

    const result = await authService.registerUser({
      email,
      password,
      role: role || 'PARTICIPANT',
      full_name,
      affiliation,
      skills: Array.isArray(skills) ? skills : [],
      track_preference,
      dietary_requirements,
      accessibility_needs,
      github_username,
      portfolio_url,
      bio
    });

    res.status(201).json({
      success: true,
      message: `Account registered successfully as ${result.profile.role}`,
      profile: result.profile,
      token: result.token,
      ticket: result.ticket
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const result = await authService.loginUser({ email, password });
    res.json({
      success: true,
      message: `Logged in as ${result.profile.full_name}`,
      profile: result.profile,
      token: result.token,
      team: result.team
    });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 3. Current Authenticated User Profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const profile = await db.getProfileById(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    const team = await db.getUserTeam(req.user.id);

    res.json({
      success: true,
      profile,
      team
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Social Developer Portfolio Import (GitHub)
router.post('/social/github', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'GitHub username is required.' });
    }
    const imported = await authService.importGitHubProfile(username);
    res.json(imported);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Social Developer Portfolio Import (Google)
router.post('/social/google', async (req, res) => {
  try {
    const { email, name, picture } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Google email is required.' });
    }
    const imported = await authService.importGoogleProfile({ email, name, picture });
    res.json(imported);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Social Developer Portfolio Import (LinkedIn)
router.post('/social/linkedin', async (req, res) => {
  try {
    const { profileUrl, headline, affiliation } = req.body;
    const imported = await authService.importLinkedInProfile({ profileUrl, headline, affiliation });
    res.json(imported);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Role definitions & system capabilities
router.get('/roles', (req, res) => {
  res.json({
    success: true,
    roles: [
      { role: 'PARTICIPANT', title: 'Hacker & Participant', permissions: ['profile:edit', 'team:join', 'team:create', 'project:submit', 'ticket:request'] },
      { role: 'MENTOR', title: 'Technical Mentor', permissions: ['helpdesk:claim', 'helpdesk:resolve', 'team:view', 'status:toggle'] },
      { role: 'JUDGE', title: 'Evaluation Judge', permissions: ['submission:blind_review', 'rubric:evaluate', 'notes:private'] },
      { role: 'ORGANIZER', title: 'Hackathon Director & Admin', permissions: ['all:super_admin', 'schedule:shift', 'announcement:broadcast', 'leaderboard:export'] }
    ]
  });
});

module.exports = router;
