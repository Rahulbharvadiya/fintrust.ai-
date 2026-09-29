// Full TypeScript Type Definitions for fintrust.ai & Hackathon OS v2.0

export interface Applicant {
  name: string;
  email: string;
  phone: string;
  college: string;
}

export interface FlagItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  conflictingRegistrationId?: string;
  originalApplicantName?: string;
  timestamp?: string;
}

export interface ScoreBreakdown {
  authenticity: number;
  faceBiometrics: number;
  identityEligibility: number;
  deduplication: number;
}

export interface ForensicAnomaly {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  field: string;
  description: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  recommendation: string;
}

export interface RegistrationRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  docType: 'AADHAAR' | 'COLLEGE_ID' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'UNKNOWN';
  idNumber: string;
  dob: string | null;
  age: number | null;
  status: 'VERIFIED' | 'REVIEW_NEEDED' | 'REJECTED';
  statusBadge: string;
  trustScore: number;
  scoreBreakdown?: ScoreBreakdown;
  decisionReason: string;
  flags?: FlagItem[];
  isSybilAttack?: boolean;
  isDuplicate?: boolean;
  sybilConflictRecord?: any;
  documentImage?: string;
  selfieImage?: string;
  forensics?: {
    authenticityScore: number;
    qualityScore: number;
    tamperRiskLevel: string;
    isTampered: boolean;
    anomalies: ForensicAnomaly[];
  };
  biometrics?: {
    faceMatchStatus: string;
    similarityScore: number;
    reason: string;
  };
  parsedFields?: {
    name: string | null;
    dob: string | null;
    idNumber: string | null;
    gender: string | null;
    institution: string | null;
    validUpto: string | null;
    rollNo: string | null;
  };
  ticket?: any;
  checkInStatus?: string;
  timestamp: string;
}

export interface TestVector {
  id: string;
  label: string;
  category: string;
  expectedOutcome: string;
  description: string;
  applicant: Applicant;
  docType: string;
  idNumber: string;
  dob: string;
  ocrLines: string[];
  simulatedAnomaly: string | null;
  documentSvg: string;
  selfieSvg: string;
}

export interface EventConfig {
  eventId: string;
  eventName: string;
  eventDate: string;
  ageRestrictions: {
    enabled: boolean;
    minAge: number;
    maxAge: number;
  };
  studentOnly: boolean;
  requireFaceMatch: boolean;
  acceptedDocTypes: string[];
  thresholds: {
    autoApproveScore: number;
    reviewQueueScore: number;
  };
}

// ==============================================================================
// VERSION 2.0 EXTENDED TYPES
// ==============================================================================

export type UserRole = 'PARTICIPANT' | 'MENTOR' | 'JUDGE' | 'ORGANIZER';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  github_username?: string;
  portfolio_url?: string;
  bio?: string;
  affiliation?: string;
  skills: string[];
  track_preference: string;
  dietary_requirements?: string;
  accessibility_needs?: string | null;
  looking_for_team: boolean;
  waiver_signed: boolean;
  waiver_signature?: string;
  waiver_signed_at?: string;
  checked_in: boolean;
  check_in_timestamp?: string;
  ticket_id?: string;
  trust_score: number;
  verification_status: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: 'LEAD' | 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'AI_ML' | 'DESIGN' | 'MOBILE';
  joined_at?: string;
  name: string;
  email?: string;
  avatar_url?: string;
  github_username?: string;
  skills?: string[];
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  track: string;
  leader_id: string;
  invite_code: string;
  max_members: number;
  current_members_count: number;
  looking_for_skills: string[];
  pitch_summary?: string;
  status: 'FORMING' | 'LOCKED' | 'SUBMITTED' | 'DISQUALIFIED';
  discord_webhook_url?: string;
  slack_webhook_url?: string;
  members?: TeamMember[];
  openSpots?: number;
  submission?: Submission | null;
}

export interface MentorTicket {
  id: string;
  team_id: string;
  team_name?: string;
  requester_id: string;
  requester_name?: string;
  title: string;
  domain: 'AI_ML' | 'FRONTEND' | 'BACKEND' | 'CLOUD_DEVOPS' | 'UI_UX_DESIGN' | 'PITCH_PRESENTATION' | 'GENERAL_BLOCKER';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  room_location: string;
  table_number: string;
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED' | 'CLOSED';
  claimed_by?: string | null;
  mentor_name?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  claimed_at?: string;
  resolved_at?: string;
}

export interface MentorProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  affiliation?: string;
  skills: string[];
  domains: string[];
  is_available: boolean;
  current_location: string;
  contact_handle: string;
  total_tickets_resolved: number;
  average_rating: number;
}

export interface Submission {
  id: string;
  team_id: string;
  team_name?: string;
  project_title: string;
  tagline: string;
  description: string;
  track: string;
  github_repo_url: string;
  gitlab_repo_url?: string | null;
  live_demo_url?: string | null;
  commit_count: number;
  last_commit_hash?: string;
  repo_verified: boolean;
  license_type: string;
  video_url?: string | null;
  slides_url?: string | null;
  diagram_url?: string | null;
  gallery_images?: string[];
  cryptographic_receipt?: string | null;
  is_draft: boolean;
  submitted_at?: string | null;
}

export interface JudgingCriteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description?: string;
}

export interface JudgingRubric {
  id: string;
  name: string;
  description: string;
  criteria: JudgingCriteria[];
  is_active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  submission_id: string;
  project_title: string;
  team_name: string;
  track: string;
  live_demo_url?: string;
  github_repo_url?: string;
  eval_count: number;
  average_raw_score: number;
  normalized_score: number;
  variance_discrepancy: boolean;
  discrepancy_score: number;
  evaluations?: {
    judge_name: string;
    raw_score: number;
    normalized_score: number;
    notes?: string;
  }[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  category: 'CEREMONY' | 'MILESTONE' | 'MEAL' | 'WORKSHOP' | 'MENTORING' | 'PITCH' | 'SOCIAL';
  start_time: string;
  end_time: string;
  location: string;
  is_delayed: boolean;
  delay_minutes: number;
  is_active_now: boolean;
  sort_order?: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  urgency: 'INFO' | 'WARNING' | 'CRITICAL';
  target_role: string;
  created_at: string;
  is_active: boolean;
}

export interface SponsorBooth {
  id: string;
  name: string;
  tier: 'TITLE' | 'PLATINUM' | 'GOLD' | 'SILVER';
  logo_url?: string;
  booth_location: string;
  challenge_title: string;
  challenge_description: string;
  bounty_amount: string;
  tech_tags: string[];
  api_docs_url?: string;
  contact_mentor?: string;
  website_url?: string;
}

export interface PresentationQueueItem {
  id: string;
  team_id: string;
  team_name?: string;
  slot_number: number;
  estimated_start: string;
  room: string;
  status: 'WAITING' | 'ON_DECK' | 'PRESENTING' | 'COMPLETED';
  stream_url?: string;
}
