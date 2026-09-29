// Central Configuration for fintrust.ai & Hackathon OS v2
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_v2_fintrust_ultra_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const IS_VERCEL = !!process.env.VERCEL;
const PORT = process.env.PORT || 5000;

// Submissions cutoff timestamp (default 24h from now if not explicitly provided)
const SUBMISSION_DEADLINE_MS = process.env.SUBMISSION_DEADLINE_MS 
  ? parseInt(process.env.SUBMISSION_DEADLINE_MS, 10) 
  : Date.now() + 24 * 60 * 60 * 1000;

// Rate limit settings
const RATE_LIMITS = {
  GENERAL: { windowMs: 60 * 1000, max: 180 }, // 180 req/min
  AUTH: { windowMs: 60 * 1000, max: 30 },     // 30 req/min
  VERIFY: { windowMs: 60 * 1000, max: 40 },   // 40 req/min
  SUBMIT: { windowMs: 60 * 1000, max: 25 },   // 25 req/min
  CHECKIN: { windowMs: 60 * 1000, max: 60 }   // 60 req/min
};

module.exports = {
  PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  IS_VERCEL,
  SUBMISSION_DEADLINE_MS,
  RATE_LIMITS,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
