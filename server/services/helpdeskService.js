// Mentor Helpdesk Queue & Live Support Dispatch Service
const db = require('../db/databaseAdapter');

async function createTicket({ teamId, requesterId, title, domain, urgency, description, roomLocation, tableNumber }) {
  if (!title || !description) {
    throw new Error('Ticket title and detailed issue description are required.');
  }

  const ticket = await db.createMentorTicket({
    team_id: teamId,
    requester_id: requesterId,
    title,
    domain: domain || 'GENERAL_BLOCKER',
    urgency: urgency || 'MEDIUM',
    description,
    room_location: roomLocation || 'Main Arena',
    table_number: tableNumber || 'N/A'
  });

  return ticket;
}

async function getQueueMetrics() {
  const allTickets = await db.getMentorTickets({ status: 'ALL' });
  const openCount = allTickets.filter(t => t.status === 'OPEN').length;
  const claimedCount = allTickets.filter(t => t.status === 'CLAIMED').length;
  const resolvedCount = allTickets.filter(t => t.status === 'RESOLVED').length;

  const domainBreakdown = {};
  allTickets.forEach(t => {
    domainBreakdown[t.domain] = (domainBreakdown[t.domain] || 0) + 1;
  });

  const mentors = await db.getAllMentors();
  const availableMentorsCount = mentors.filter(m => m.is_available).length;

  return {
    totalTickets: allTickets.length,
    openTickets: openCount,
    claimedTickets: claimedCount,
    resolvedTickets: resolvedCount,
    availableMentors: availableMentorsCount,
    domainBreakdown,
    estimatedWaitMinutes: Math.max(5, Math.round((openCount / Math.max(1, availableMentorsCount)) * 8))
  };
}

module.exports = {
  createTicket,
  getQueueMetrics
};
