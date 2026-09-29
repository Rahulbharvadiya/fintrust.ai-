// Digital Check-In, QR Gate Desk Verification & Waiver Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const { processVenueGateCheckIn } = require('../services/checkInService');
const { optionalToken } = require('../middleware/authMiddleware');

// 1. Venue Desk QR Code Gate Check-In Endpoint
router.post('/scan', optionalToken, async (req, res) => {
  try {
    const { ticketId, qrData } = req.body;
    const identifier = ticketId || qrData;

    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Ticket ID or QR code data is required.' });
    }

    const result = await processVenueGateCheckIn({
      ticketIdOrUserId: identifier.trim(),
      gateOperatorId: req.user ? req.user.full_name : 'Venue Desk Scanner #1'
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Gate Desk Attendance & Check-In Statistics
router.get('/stats', (req, res) => {
  try {
    const profiles = Array.from(db.memoryStore.profiles.values()).filter(p => p.role === 'PARTICIPANT');
    const checkedInCount = profiles.filter(p => p.checked_in).length;
    const waiverSignedCount = profiles.filter(p => p.waiver_signed).length;

    res.json({
      success: true,
      stats: {
        totalRegisteredParticipants: profiles.length,
        checkedInCount,
        pendingCheckInCount: Math.max(0, profiles.length - checkedInCount),
        waiverSignedCount,
        attendancePercentage: profiles.length > 0 ? parseFloat(((checkedInCount / profiles.length) * 100).toFixed(1)) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
