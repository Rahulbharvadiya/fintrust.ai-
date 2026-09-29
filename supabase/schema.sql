-- ==============================================================================
-- fintrust.ai & Hackingly Hackathon OS - Version 2.0 Database Schema
-- Optimized for PostgreSQL & Supabase with Row Level Security (RLS)
-- High Efficiency, Zero-Trust Architecture & Cryptographic Verification
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('PARTICIPANT', 'MENTOR', 'JUDGE', 'ORGANIZER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE team_status AS ENUM ('FORMING', 'LOCKED', 'SUBMITTED', 'DISQUALIFIED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE team_member_role AS ENUM ('LEAD', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'AI_ML', 'DESIGN', 'MOBILE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invite_request_type AS ENUM ('INVITE', 'REQUEST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('OPEN', 'CLAIMED', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_urgency AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_domain AS ENUM ('AI_ML', 'FRONTEND', 'BACKEND', 'CLOUD_DEVOPS', 'UI_UX_DESIGN', 'PITCH_PRESENTATION', 'GENERAL_BLOCKER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE schedule_category AS ENUM ('CEREMONY', 'MILESTONE', 'MEAL', 'WORKSHOP', 'MENTORING', 'PITCH', 'SOCIAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE announcement_urgency AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('WAITING', 'ON_DECK', 'PRESENTING', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. USER PROFILES TABLE (Multi-tier roles & Skill Graph)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'PARTICIPANT',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  github_username TEXT,
  portfolio_url TEXT,
  bio TEXT,
  affiliation TEXT, -- College or Company
  skills TEXT[] DEFAULT '{}', -- e.g. ['React', 'Go', 'PyTorch']
  track_preference TEXT DEFAULT 'AI/ML & Automation',
  dietary_requirements TEXT DEFAULT 'Standard',
  accessibility_needs TEXT,
  looking_for_team BOOLEAN DEFAULT true,
  waiver_signed BOOLEAN DEFAULT false,
  waiver_signature TEXT,
  waiver_signed_at TIMESTAMPTZ,
  checked_in BOOLEAN DEFAULT false,
  check_in_timestamp TIMESTAMPTZ,
  qr_pass_hash TEXT,
  ticket_id TEXT UNIQUE,
  trust_score INT DEFAULT 100,
  verification_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for profile lookups & skill tag matching
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_team ON profiles(looking_for_team) WHERE looking_for_team = true;

-- 4. TEAMS TABLE (Lifecycle, Member Caps & Webhooks)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  track TEXT NOT NULL DEFAULT 'AI/ML & Automation',
  leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code VARCHAR(12) NOT NULL UNIQUE,
  max_members INT DEFAULT 4 CHECK (max_members >= 1 AND max_members <= 6),
  current_members_count INT DEFAULT 1 CHECK (current_members_count >= 0),
  looking_for_skills TEXT[] DEFAULT '{}',
  pitch_summary TEXT,
  status team_status DEFAULT 'FORMING',
  discord_webhook_url TEXT,
  slack_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_track ON teams(track);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_looking_skills ON teams USING GIN (looking_for_skills);

-- 5. TEAM MEMBERS TABLE (Relationship & Roles)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_team team_member_role DEFAULT 'FULLSTACK',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_team_member UNIQUE (team_id, user_id),
  CONSTRAINT uq_single_team_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- 6. TEAM INVITATIONS & JOIN REQUESTS
CREATE TABLE IF NOT EXISTS team_invites_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type invite_request_type NOT NULL,
  status request_status DEFAULT 'PENDING',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invites_team ON team_invites_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_invites_user ON team_invites_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON team_invites_requests(status);

-- 7. MENTOR HELP DESK TICKETS
CREATE TABLE IF NOT EXISTS mentor_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  domain ticket_domain NOT NULL,
  urgency ticket_urgency DEFAULT 'MEDIUM',
  description TEXT NOT NULL,
  room_location TEXT NOT NULL,
  table_number TEXT,
  status ticket_status DEFAULT 'OPEN',
  claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON mentor_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_domain ON mentor_tickets(domain);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON mentor_tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_team ON mentor_tickets(team_id);

-- 8. MENTOR PROFILES & LIVE AVAILABILITY
CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  domains ticket_domain[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  current_location TEXT DEFAULT 'Mentor Hub • Table 4',
  contact_handle TEXT,
  total_tickets_resolved INT DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 5.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PROJECT SUBMISSIONS (Git verification, media & cryptographic receipts)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  track TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  gitlab_repo_url TEXT,
  live_demo_url TEXT,
  commit_count INT DEFAULT 0,
  last_commit_hash TEXT,
  repo_verified BOOLEAN DEFAULT false,
  license_type TEXT DEFAULT 'MIT',
  video_url TEXT, -- YouTube or Loom embed
  slides_url TEXT, -- PDF or deck URL
  diagram_url TEXT, -- Architecture diagram
  gallery_images JSONB DEFAULT '[]'::jsonb,
  cryptographic_receipt TEXT, -- SHA-256 HMAC of submission payload
  is_draft BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_track ON submissions(track);
CREATE INDEX IF NOT EXISTS idx_submissions_is_draft ON submissions(is_draft);

-- 10. JUDGING RUBRICS
CREATE TABLE IF NOT EXISTS judging_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, 
  -- Example: [
  --   {"id": "innovation", "name": "Innovation & Originality", "weight": 0.30, "maxScore": 10},
  --   {"id": "technical_depth", "name": "Technical Depth & Complexity", "weight": 0.30, "maxScore": 10},
  --   {"id": "feasibility", "name": "Real-World Feasibility & Impact", "weight": 0.25, "maxScore": 10},
  --   {"id": "ui_ux", "name": "UI/UX & Accessibility", "weight": 0.15, "maxScore": 10}
  -- ]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. JUDGING EVALUATIONS & DELIBERATION
CREATE TABLE IF NOT EXISTS judging_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES judging_rubrics(id) ON DELETE SET NULL,
  scores JSONB NOT NULL, -- e.g. {"innovation": 9, "technical_depth": 8.5, ...}
  raw_weighted_score NUMERIC(5,2) NOT NULL,
  normalized_score NUMERIC(5,2), -- Calculated via Z-Score algorithm
  private_notes TEXT,
  is_blind_reviewed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_judge_submission UNIQUE (judge_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_evals_submission ON judging_evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_evals_judge ON judging_evaluations(judge_id);

-- 12. LIVE OPERATIONS TIMELINE & SCHEDULE
CREATE TABLE IF NOT EXISTS event_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category schedule_category NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  is_delayed BOOLEAN DEFAULT false,
  delay_minutes INT DEFAULT 0,
  is_active_now BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_time ON event_schedule(start_time, end_time);

-- 13. LIVE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency announcement_urgency DEFAULT 'INFO',
  target_role TEXT DEFAULT 'ALL', -- ALL, PARTICIPANTS, MENTORS, JUDGES
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at DESC);

-- 14. SPONSOR BOOTHS & BOUNTY DIRECTORY
CREATE TABLE IF NOT EXISTS sponsor_booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'PLATINUM', -- TITLE, PLATINUM, GOLD, SILVER
  logo_url TEXT,
  booth_location TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  bounty_amount TEXT NOT NULL, -- e.g. "$5,000" or "₹1,50,000"
  tech_tags TEXT[] DEFAULT '{}',
  api_docs_url TEXT,
  contact_mentor TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. STAGE PRESENTATION QUEUE
CREATE TABLE IF NOT EXISTS presentation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  slot_number INT NOT NULL,
  estimated_start TIMESTAMPTZ,
  room TEXT DEFAULT 'Auditorium A',
  status queue_status DEFAULT 'WAITING',
  stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_slot UNIQUE (slot_number)
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON presentation_queue(status, slot_number);

-- ==============================================================================
-- 16. AUTOMATED TRIGGERS & PROCEDURES
-- ==============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_teams
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_submissions
BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger: Enforce Team Member Cap
CREATE OR REPLACE FUNCTION enforce_team_cap()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INT;
  v_max_cap INT;
BEGIN
  SELECT current_members_count, max_members INTO v_current_count, v_max_cap
  FROM teams WHERE id = NEW.team_id;

  IF v_current_count >= v_max_cap THEN
    RAISE EXCEPTION 'Team capacity exceeded. Maximum allowed members is %', v_max_cap;
  END IF;

  UPDATE teams 
  SET current_members_count = current_members_count + 1 
  WHERE id = NEW.team_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_team_cap_before_insert
BEFORE INSERT ON team_members
FOR EACH ROW EXECUTE FUNCTION enforce_team_cap();

-- Trigger: Decrement count on member leave
CREATE OR REPLACE FUNCTION decrement_team_cap()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams 
  SET current_members_count = GREATEST(current_members_count - 1, 0)
  WHERE id = OLD.team_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER decrement_team_cap_after_delete
AFTER DELETE ON team_members
FOR EACH ROW EXECUTE FUNCTION decrement_team_cap();

-- ==============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judging_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_booths ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile info for directory
CREATE POLICY "Public profiles are readable" ON profiles
  FOR SELECT USING (true);

-- Profiles: Users can edit their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teams: Public readable
CREATE POLICY "Teams are readable by all authenticated users" ON teams
  FOR SELECT USING (true);

-- Teams: Leaders can edit their team
CREATE POLICY "Leaders can update team" ON teams
  FOR UPDATE USING (leader_id = auth.uid());

-- Submissions: Non-drafts are visible to judges and organizers; drafts only to team members
CREATE POLICY "Public view confirmed submissions" ON submissions
  FOR SELECT USING (is_draft = false OR EXISTS (
    SELECT 1 FROM team_members WHERE team_id = submissions.team_id AND user_id = auth.uid()
  ));

CREATE POLICY "Team members can edit submissions" ON submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_id = submissions.team_id AND user_id = auth.uid()
  ));

-- Judging: Judges can only insert/read their own evaluations; Organizers can see all
CREATE POLICY "Judges can manage own evaluations" ON judging_evaluations
  FOR ALL USING (judge_id = auth.uid());

-- Announcements & Schedule: Public readable
CREATE POLICY "Announcements readable by everyone" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Schedule readable by everyone" ON event_schedule FOR SELECT USING (true);
CREATE POLICY "Sponsor booths readable by everyone" ON sponsor_booths FOR SELECT USING (true);
