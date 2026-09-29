// Evaluation, Judging & Normalized Deliberation Analytics Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const judgingService = require('../services/judgingService');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// 1. Get Active Weighted Rubric
router.get('/rubric', async (req, res) => {
  try {
    const rubric = await db.getActiveRubric();
    res.json({
      success: true,
      rubric
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Submissions Assigned for Judge (Supports Blind Review Mode)
router.get('/submissions', verifyToken, requireRole(['JUDGE', 'ORGANIZER']), async (req, res) => {
  try {
    const { track, blindReview } = req.query;
    const isBlind = blindReview === 'true';

    const submissions = await judgingService.getSubmissionsForJudge({
      judgeId: req.user.id,
      track: track || 'ALL',
      blindReview: isBlind
    });

    res.json({
      success: true,
      total: submissions.length,
      isBlindReviewActive: isBlind,
      submissions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Submit Evaluation & Scores
router.post('/evaluate', verifyToken, requireRole(['JUDGE', 'ORGANIZER']), async (req, res) => {
  try {
    const { submissionId, scores, privateNotes, isBlindReviewed } = req.body;
    if (!submissionId || !scores) {
      return res.status(400).json({ success: false, error: 'submissionId and scores are required.' });
    }

    const evaluation = await db.submitJudgeEvaluation({
      judge_id: req.user.id,
      submission_id: submissionId,
      scores,
      private_notes: privateNotes,
      is_blind_reviewed: isBlindReviewed
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully.',
      evaluation
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Normalized Leaderboard & Deliberation Analytics (Z-Score Adjusted)
router.get('/leaderboard', async (req, res) => {
  try {
    const { track } = req.query;
    const analytics = db.calculateNormalizedLeaderboard({ track });

    res.json({
      success: true,
      ...analytics
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Deliberation CSV Export
router.get('/export-csv', verifyToken, requireRole(['JUDGE', 'ORGANIZER']), async (req, res) => {
  try {
    const { track } = req.query;
    const analytics = db.calculateNormalizedLeaderboard({ track });
    const csvContent = judgingService.generateLeaderboardCsv(analytics.leaderboard);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hackathon_deliberation_leaderboard.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
