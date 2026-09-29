// Live Operations Timeline, Real-Time Shifts, Announcements & Stage Presentation Queue Routes
const express = require('express');
const router = express.Router();
const db = require('../db/databaseAdapter');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Maintain active Server-Sent Event (SSE) client connections
const sseClients = new Set();

function broadcastSseEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// 1. Live Server-Sent Events (SSE) Stream
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 2. Event Schedule Timeline
router.get('/schedule', (req, res) => {
  try {
    const schedule = db.getSchedule();
    res.json({
      success: true,
      total: schedule.length,
      schedule
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Organizer Timeline Shift (+/- N Minutes)
router.post('/schedule/shift', verifyToken, requireRole(['ORGANIZER']), (req, res) => {
  try {
    const { minutes, reason } = req.body;
    const shiftMinutes = parseInt(minutes, 10);
    if (isNaN(shiftMinutes)) {
      return res.status(400).json({ success: false, error: 'Shift minutes must be a valid integer.' });
    }

    const result = db.shiftScheduleTimeline(shiftMinutes, reason);

    // Push real-time event to all SSE clients
    broadcastSseEvent('SCHEDULE_SHIFT', {
      minutes: shiftMinutes,
      reason,
      announcement: result.announcement
    });

    res.json({
      success: true,
      message: `Schedule shifted by ${shiftMinutes} minutes.`,
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Live Announcements Feed
router.get('/announcements', (req, res) => {
  try {
    const { limit } = req.query;
    const announcements = db.getAnnouncements({ limit: limit ? parseInt(limit, 10) : 20 });
    res.json({
      success: true,
      total: announcements.length,
      announcements
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Broadcast New Live Announcement (Organizers only)
router.post('/announcements', verifyToken, requireRole(['ORGANIZER']), (req, res) => {
  try {
    const { title, message, urgency, targetRole } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required.' });
    }

    const announcement = db.createAnnouncement({
      title,
      message,
      urgency,
      target_role: targetRole || 'ALL',
      author_id: req.user.id
    });

    // Real-time broadcast
    broadcastSseEvent('ANNOUNCEMENT', announcement);

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted live.',
      announcement
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Sponsor Booth Directory
router.get('/sponsor-booths', (req, res) => {
  try {
    const booths = db.getSponsorBooths();
    res.json({
      success: true,
      total: booths.length,
      booths
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Stage Presentation Queue
router.get('/presentation-queue', (req, res) => {
  try {
    const queue = db.getPresentationQueue();
    res.json({
      success: true,
      total: queue.length,
      queue
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Update Stage Presentation Status (WAITING, ON_DECK, PRESENTING, COMPLETED)
router.put('/presentation-queue/:slot', verifyToken, requireRole(['ORGANIZER']), (req, res) => {
  try {
    const { status } = req.body;
    const updated = db.updateQueueStatus(req.params.slot, status);

    broadcastSseEvent('QUEUE_UPDATE', updated);

    res.json({
      success: true,
      message: `Slot ${req.params.slot} updated to ${status}.`,
      item: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
