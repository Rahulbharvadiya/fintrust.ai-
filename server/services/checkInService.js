// Digital Check-In, Cryptographic QR Pass & Waiver Signature Service
const crypto = require('crypto');
const db = require('../db/databaseAdapter');
const { generateParticipantTicket } = require('./ticketService');

/**
 * Digitally signs the legal event waiver
 */
async function signEventWaiver({ userId, signatureString, agreementChecked }) {
  if (!agreementChecked) {
    throw new Error('You must confirm acceptance of event terms, code of conduct, and IP policies.');
  }
  if (!signatureString || signatureString.trim().length < 2) {
    throw new Error('Valid legal signature name is required.');
  }

  const profile = await db.getProfileById(userId);
  if (!profile) throw new Error('Participant profile not found.');

  profile.waiver_signed = true;
  profile.waiver_signature = signatureString.trim();
  profile.waiver_signed_at = new Date().toISOString();

  // If ticket doesn't exist, issue it
  if (!profile.ticket_id) {
    const ticket = generateParticipantTicket({
      registrationId: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      name: profile.full_name,
      college: profile.affiliation || 'Accredited Institution',
      age: 21,
      trustScore: profile.trust_score || 98,
      docType: 'DIGITAL_TICKET_PASS',
      eventName: 'AI Build & Hackathon 2026'
    });
    profile.ticket_id = ticket.ticketId;
    profile.qr_pass_hash = ticket.cryptoSignature;
  }

  await db.upsertProfile(profile);

  return {
    success: true,
    message: 'Event legal waiver signed and recorded successfully.',
    profile
  };
}

/**
 * Day-of-Event Venue Gate Desk Check-In
 * Verifies QR code / Ticket ID, confirms waiver status, and registers physical venue arrival
 */
async function processVenueGateCheckIn({ ticketIdOrUserId, gateOperatorId = null }) {
  let profile = null;

  // Lookup by ticketId or by userId
  for (const p of db.memoryStore.profiles.values()) {
    if (p.ticket_id === ticketIdOrUserId || p.id === ticketIdOrUserId) {
      profile = p;
      break;
    }
  }

  if (!profile) {
    throw new Error('Participant ticket pass not found in registration registry.');
  }

  if (profile.checked_in) {
    return {
      success: true,
      alreadyCheckedIn: true,
      message: `Participant ${profile.full_name} is already checked in. (Original check-in: ${profile.check_in_timestamp})`,
      profile
    };
  }

  if (!profile.waiver_signed) {
    throw new Error(
      `Check-In Blocked: Participant ${profile.full_name} has not signed the mandatory event safety & IP waiver.`
    );
  }

  profile.checked_in = true;
  profile.check_in_timestamp = new Date().toISOString();
  profile.gate_operator = gateOperatorId || 'Main Venue Gate Desk #1';

  await db.upsertProfile(profile);

  return {
    success: true,
    alreadyCheckedIn: false,
    message: `Access Granted! Welcome ${profile.full_name} to the event!`,
    profile,
    badgeInfo: {
      name: profile.full_name,
      affiliation: profile.affiliation,
      role: profile.role,
      track: profile.track_preference,
      dietary: profile.dietary_requirements,
      ticketId: profile.ticket_id
    }
  };
}

module.exports = {
  signEventWaiver,
  processVenueGateCheckIn
};
