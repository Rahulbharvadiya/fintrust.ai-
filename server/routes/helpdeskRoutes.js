// Mentor Helpdesk Queue & Technical Guidance Hub Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const helpdeskService = require('../services/helpdeskService');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// 1. Log New Helpdesk Blocker / Ticket
router.post('/tickets', verifyToken, async (req, res) => {
  try {
    const { teamId, title, domain, urgency, description, roomLocation, tableNumber } = req.body;
    
    // Find team if not passed directly
    let targetTeamId = teamId;
    if (!targetTeamId) {
      const userTeam = await db.getUserTeam(req.user.id);
      if (userTeam) targetTeamId = userTeam.id;
    }

    if (!targetTeamId) {
      return res.status(400).json({ success: false, error: 'You must belong to a team to submit a mentor ticket.' });
    }

    const ticket = await helpdeskService.createTicket({
      teamId: targetTeamId,
      requesterId: req.user.id,
      title,
      domain,
      urgency,
      description,
      roomLocation,
      tableNumber
    });

    res.status(201).json({
      success: true,
      message: 'Mentor ticket dispatched to live queue.',
      ticket
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Get Live Ticket Queue (Filter by domain, status)
router.get('/tickets', async (req, res) => {
  try {
    const { status, domain, teamId } = req.query;
    const tickets = await db.getMentorTickets({ status, domain, teamId });
    res.json({
      success: true,
      total: tickets.length,
      tickets
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Claim Ticket (Mentors & Organizers only)
router.put('/tickets/:id/claim', verifyToken, requireRole(['MENTOR', 'ORGANIZER']), async (req, res) => {
  try {
    const updated = await db.claimMentorTicket(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Ticket claimed! You are assigned to guide this team.',
      ticket: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Resolve Ticket
router.put('/tickets/:id/resolve', verifyToken, requireRole(['MENTOR', 'ORGANIZER']), async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await db.resolveMentorTicket(req.params.id, req.user.id, notes);
    res.json({
      success: true,
      message: 'Ticket marked as resolved.',
      ticket: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Active Mentors Directory (Room locations, domains)
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await db.getAllMentors();
    res.json({
      success: true,
      total: mentors.length,
      mentors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Mentor Toggles Availability & Venue Room Location
router.put('/mentors/availability', verifyToken, requireRole(['MENTOR', 'ORGANIZER']), async (req, res) => {
  try {
    const { isAvailable, currentRoom, contactHandle } = req.body;
    let mentorProfile = db.memoryStore.mentor_profiles.get(req.user.id);
    if (!mentorProfile) {
      mentorProfile = {
        user_id: req.user.id,
        domains: ['GENERAL_BLOCKER'],
        is_available: true,
        current_location: currentRoom || 'Mentor Hub',
        contact_handle: contactHandle || '@mentor',
        total_tickets_resolved: 0,
        average_rating: 5.0
      };
      db.memoryStore.mentor_profiles.set(req.user.id, mentorProfile);
    } else {
      if (isAvailable !== undefined) mentorProfile.is_available = Boolean(isAvailable);
      if (currentRoom) mentorProfile.current_location = currentRoom;
      if (contactHandle) mentorProfile.contact_handle = contactHandle;
      mentorProfile.updated_at = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Mentor status updated.',
      mentorProfile
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Queue Metrics & Estimated Wait Time
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await helpdeskService.getQueueMetrics();
    res.json({
      success: true,
      metrics
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
