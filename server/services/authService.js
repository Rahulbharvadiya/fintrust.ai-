// Multi-Tier Authentication & Social Developer Portfolio Import Service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db/databaseAdapter');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { generateParticipantTicket } = require('./ticketService');

/**
 * Signs a standard JWT with user claims
 */
function createAuthToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    affiliation: user.affiliation || '',
    track_preference: user.track_preference || 'General'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Simulates / Imports GitHub Developer Profile & Repositories
 */
async function importGitHubProfile(username) {
  const cleanUsername = username.replace('@', '').trim();
  
  // Real world simulation with rich developer skill detection
  const sampleRepos = [
    { name: `${cleanUsername}-distributed-cache`, language: 'Go', stars: 142, commits: 88 },
    { name: 'neural-vision-pipeline', language: 'Python', stars: 89, commits: 54 },
    { name: 'reactive-web-canvas', language: 'TypeScript', stars: 65, commits: 120 }
  ];

  const inferredSkills = ['Git', 'TypeScript', 'Go', 'Python', 'React', 'Docker'];

  return {
    success: true,
    platform: 'GITHUB',
    username: cleanUsername,
    avatar_url: `https://github.com/${cleanUsername}.png`,
    portfolio_url: `https://github.com/${cleanUsername}`,
    bio: `Full-stack & systems developer. Open-source contributor on GitHub (@${cleanUsername}).`,
    public_repos_count: sampleRepos.length + 12,
    top_repositories: sampleRepos,
    detected_skills: inferredSkills
  };
}

/**
 * Simulates Google OAuth profile resolution
 */
async function importGoogleProfile({ email, name, picture }) {
  return {
    success: true,
    platform: 'GOOGLE',
    email: email.toLowerCase(),
    full_name: name || email.split('@')[0],
    avatar_url: picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`
  };
}

/**
 * Simulates LinkedIn Professional profile import
 */
async function importLinkedInProfile({ profileUrl, headline, affiliation }) {
  return {
    success: true,
    platform: 'LINKEDIN',
    profile_url: profileUrl,
    headline: headline || 'Software Engineer & Hackathon Builder',
    affiliation: affiliation || 'Independent Developer'
  };
}

/**
 * Register a new user with multi-tier role and rich skill graph
 */
async function registerUser({
  email,
  password,
  role = 'PARTICIPANT',
  full_name,
  affiliation,
  skills = [],
  track_preference = 'AI/ML & Automation',
  dietary_requirements = 'Standard',
  accessibility_needs = null,
  github_username = null,
  portfolio_url = null,
  bio = null
}) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.getProfileByEmail(normalizedEmail);
  if (existing) {
    throw new Error(`An account with email ${normalizedEmail} already exists.`);
  }

  // Hash password
  const password_hash = password ? await bcrypt.hash(password, 10) : null;

  // Auto-generate Digital Ticket for participant
  const profileId = require('uuid').v4();
  const ticket = generateParticipantTicket({
    registrationId: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
    name: full_name,
    college: affiliation || 'Accredited Institution',
    age: 21,
    trustScore: 100,
    docType: 'DIGITAL_AUTH_PASS',
    eventName: 'Global AI & Web3 Hackathon 2026'
  });

  const profile = await db.upsertProfile({
    id: profileId,
    email: normalizedEmail,
    password_hash,
    role: role.toUpperCase(),
    full_name,
    avatar_url: github_username ? `https://github.com/${github_username.replace('@', '')}.png` : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
    github_username,
    portfolio_url,
    bio: bio || `${role} participating in Hackathon 2026.`,
    affiliation,
    skills,
    track_preference,
    dietary_requirements,
    accessibility_needs,
    looking_for_team: role.toUpperCase() === 'PARTICIPANT',
    waiver_signed: false,
    checked_in: false,
    ticket_id: ticket.ticketId,
    trust_score: 100,
    verification_status: 'VERIFIED'
  });

  const token = createAuthToken(profile);

  return {
    profile,
    token,
    ticket
  };
}

/**
 * Login user
 */
async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.getProfileByEmail(normalizedEmail);
  if (!user) {
    throw new Error('Invalid email or credentials.');
  }

  // If password exists, verify hash
  if (user.password_hash && password) {
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }
  }

  const token = createAuthToken(user);
  const userTeam = await db.getUserTeam(user.id);

  return {
    profile: user,
    token,
    team: userTeam
  };
}

module.exports = {
  createAuthToken,
  importGitHubProfile,
  importGoogleProfile,
  importLinkedInProfile,
  registerUser,
  loginUser
};
