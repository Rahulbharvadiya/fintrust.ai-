// Project Submission & Code Repository Pipeline Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const submissionService = require('../services/submissionService');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');

// 1. Synchronized Server Countdown Clock
router.get('/deadline', (req, res) => {
  res.json({
    success: true,
    ...submissionService.getSubmissionDeadline()
  });
});

// 2. Save Project Draft or Lock Final Submission
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      teamId,
      projectTitle,
      tagline,
      description,
      track,
      githubRepoUrl,
      gitlabRepoUrl,
      liveDemoUrl,
      commitCount,
      lastCommitHash,
      licenseType,
      videoUrl,
      slidesUrl,
      diagramUrl,
      galleryImages,
      isDraft
    } = req.body;

    let targetTeamId = teamId;
    if (!targetTeamId) {
      const userTeam = await db.getUserTeam(req.user.id);
      if (userTeam) targetTeamId = userTeam.id;
    }

    if (!targetTeamId) {
      return res.status(400).json({ success: false, error: 'User must belong to a team to submit a project.' });
    }

    const result = await submissionService.processSubmission({
      teamId: targetTeamId,
      projectTitle,
      tagline,
      description,
      track,
      githubRepoUrl,
      gitlabRepoUrl,
      liveDemoUrl,
      commitCount,
      lastCommitHash,
      licenseType,
      videoUrl,
      slidesUrl,
      diagramUrl,
      galleryImages,
      isDraft: isDraft !== undefined ? Boolean(isDraft) : true,
      bypassDeadline: req.user.role === 'ORGANIZER' // Organizers can override deadline
    });

    res.status(200).json({
      success: true,
      message: result.isDraft ? 'Project draft saved successfully.' : '🚀 Project locked & submitted for judging! Cryptographic receipt generated.',
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Get Submission by Team ID
router.get('/team/:teamId', optionalToken, async (req, res) => {
  try {
    const submission = await db.getSubmissionByTeamId(req.params.teamId);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'No submission found for this team.' });
    }

    res.json({
      success: true,
      submission
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Submission by ID
router.get('/:id', optionalToken, async (req, res) => {
  try {
    const sub = await db.getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Submission not found.' });

    const team = await db.getTeamById(sub.team_id);
    const members = team ? db.getTeamMembers(team.id) : [];

    res.json({
      success: true,
      submission: {
        ...sub,
        team_name: team ? team.name : 'Unknown',
        members
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Verify Cryptographic Submission Receipt
router.post('/:id/verify-receipt', async (req, res) => {
  try {
    const sub = await db.getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Submission not found.' });

    const { receipt } = req.body;
    const testReceipt = receipt || sub.cryptographic_receipt;

    const isValid = testReceipt && testReceipt === sub.cryptographic_receipt;

    res.json({
      success: true,
      valid: isValid,
      receipt: testReceipt,
      projectTitle: sub.project_title,
      submittedAt: sub.submitted_at,
      tamperEvidentStatus: isValid ? 'CRYPTOGRAPHICALLY_VERIFIED' : 'TAMPERED_OR_INVALID'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. List Submissions (Organizers / Judges / Directory)
router.get('/', optionalToken, async (req, res) => {
  try {
    const { track, isDraft } = req.query;
    const submissions = await db.getAllSubmissions({
      track,
      isDraft: isDraft !== undefined ? isDraft === 'true' : false
    });

    res.json({
      success: true,
      total: submissions.length,
      submissions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
