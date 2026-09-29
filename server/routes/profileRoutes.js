// Profile Architecture, Skill Graph & Digital Pass Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');
const { signEventWaiver } = require('../services/checkInService');
const { generateParticipantTicket } = require('../services/ticketService');

// 1. Participant Directory (Filterable by skills, track, affiliation, looking for team)
router.get('/directory', optionalToken, async (req, res) => {
  try {
    const { role, skill, lookingForTeam, search, limit, offset } = req.query;
    const result = await db.findProfiles({
      role: role || 'PARTICIPANT',
      skill,
      lookingForTeam: lookingForTeam !== undefined ? lookingForTeam === 'true' : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.json({
      success: true,
      total: result.total,
      profiles: result.profiles
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Profile Details by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    const team = await db.getUserTeam(req.params.id);

    res.json({
      success: true,
      profile,
      team
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update User Profile & Skill Graph
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Only user themselves or an organizer can edit
    if (req.user.id !== req.params.id && req.user.role !== 'ORGANIZER') {
      return res.status(403).json({ success: false, error: 'Unauthorized to update another user profile.' });
    }

    const updated = await db.upsertProfile({
      ...req.body,
      id: req.params.id
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Sign Digital Legal Waiver
router.post('/:id/waiver', verifyToken, async (req, res) => {
  try {
    const { signatureString, agreementChecked } = req.body;
    const result = await signEventWaiver({
      userId: req.params.id,
      signatureString,
      agreementChecked
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Get Digital Event Ticket Pass & QR Code
router.get('/:id/ticket', async (req, res) => {
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    const ticket = generateParticipantTicket({
      registrationId: profile.ticket_id || `REG-${profile.id.slice(0, 4)}`,
      name: profile.full_name,
      college: profile.affiliation || 'Accredited Institution',
      age: 21,
      trustScore: profile.trust_score || 98,
      docType: 'SECURE_DIGITAL_PASS',
      eventName: 'AI Build Challenge 2026'
    });

    res.json({
      success: true,
      ticket: {
        ...ticket,
        waiverSigned: profile.waiver_signed,
        checkedIn: profile.checked_in,
        checkInTimestamp: profile.check_in_timestamp
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
