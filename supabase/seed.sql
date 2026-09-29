-- ==============================================================================
-- fintrust.ai & Hackingly Hackathon OS - Version 2.0 Seed Data
-- ==============================================================================

-- 1. PROFILES SEED
INSERT INTO profiles (id, email, role, full_name, avatar_url, github_username, portfolio_url, bio, affiliation, skills, track_preference, looking_for_team, waiver_signed, checked_in, ticket_id, trust_score, verification_status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aravind@hackathon.dev', 'PARTICIPANT', 'Aravind Swaminathan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'aravind-dev', 'https://aravind.codes', 'Fullstack engineer & distributed systems researcher.', 'IIT Madras', ARRAY['Go', 'React', 'Docker', 'PostgreSQL', 'Kubernetes'], 'AI/ML & Automation', false, true, true, 'TCK-2026-001', 98, 'VERIFIED'),
  ('22222222-2222-2222-2222-222222222222', 'priya.sharma@hackathon.dev', 'PARTICIPANT', 'Priya Sharma', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'priyasharma-ai', 'https://priyasharma.io', 'Computer Vision & Deep Learning specialist.', 'BITS Pilani', ARRAY['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'OpenCV'], 'AI/ML & Automation', false, true, true, 'TCK-2026-002', 96, 'VERIFIED'),
  ('33333333-3333-3333-3333-333333333333', 'marcus.vance@hackathon.dev', 'PARTICIPANT', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'marcusvance', 'https://marcusvance.design', 'Product designer obsessed with micro-interactions and high-craft design.', 'Rhode Island School of Design', ARRAY['Figma', 'UI/UX', 'TailwindCSS', 'Three.js', 'React'], 'FinTech & Web3', true, true, false, 'TCK-2026-003', 94, 'VERIFIED'),
  ('44444444-4444-4444-4444-444444444444', 'elena.rostova@hackathon.dev', 'PARTICIPANT', 'Elena Rostova', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'erostova', 'https://elena.tech', 'Rust & Solana systems engineer.', 'Stanford University', ARRAY['Rust', 'Solidity', 'WebAssembly', 'TypeScript'], 'FinTech & Web3', true, true, true, 'TCK-2026-004', 99, 'VERIFIED'),
  ('55555555-5555-5555-5555-555555555555', 'dr.kavita@google.com', 'MENTOR', 'Dr. Kavita Narang', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'knarang-google', 'https://kavitanarang.ai', 'Staff AI Research Scientist at Google DeepMind. Specialized in Multimodal LLMs & Agents.', 'Google DeepMind', ARRAY['PyTorch', 'Gemini API', 'Transformers', 'JAX'], 'AI/ML & Automation', false, true, true, 'TCK-MENTOR-01', 100, 'VERIFIED'),
  ('66666666-6666-6666-6666-666666666666', 'david.kim@vercel.com', 'MENTOR', 'David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'davidkim-edge', 'https://davidkim.sh', 'Edge Infrastructure Architect & Next.js Core Contributor.', 'Vercel', ARRAY['Next.js', 'Vercel Edge', 'Supabase', 'Serverless', 'TypeScript'], 'Open Innovation', false, true, true, 'TCK-MENTOR-02', 100, 'VERIFIED'),
  ('77777777-7777-7777-7777-777777777777', 'sarah.connor@ycombinator.com', 'JUDGE', 'Sarah Connor', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 'sconnor-yc', 'https://sarahconnor.vc', 'Partner at Y Combinator. Looking for breakthrough developer infrastructure & AI applications.', 'Y Combinator', ARRAY['Venture Capital', 'Product Market Fit', 'System Architecture'], 'AI/ML & Automation', false, true, true, 'TCK-JUDGE-01', 100, 'VERIFIED'),
  ('88888888-8888-8888-8888-888888888888', 'vikram.mehta@hackathon.org', 'ORGANIZER', 'Vikram Mehta', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'vmehta-lead', 'https://hackingly.org', 'Lead Hackathon Director & Community Architect.', 'Hackingly Global', ARRAY['Event Operations', 'Community', 'Platform Engineering'], 'All Tracks', false, true, true, 'TCK-ORG-01', 100, 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 2. MENTOR PROFILES SEED
INSERT INTO mentor_profiles (user_id, domains, is_available, current_location, contact_handle, total_tickets_resolved, average_rating)
VALUES
  ('55555555-5555-5555-5555-555555555555', ARRAY['AI_ML'::ticket_domain, 'CLOUD_DEVOPS'::ticket_domain], true, 'Mentor Hub • Booth 03 (DeepMind)', '@kavita_google', 14, 4.95),
  ('66666666-6666-6666-6666-666666666666', ARRAY['FRONTEND'::ticket_domain, 'BACKEND'::ticket_domain, 'CLOUD_DEVOPS'::ticket_domain], true, 'Main Floor • Vercel Lounge', '@david_edge', 19, 4.98)
ON CONFLICT (user_id) DO NOTHING;

-- 3. TEAMS SEED
INSERT INTO teams (id, name, slug, track, leader_id, invite_code, max_members, current_members_count, looking_for_skills, pitch_summary, status, discord_webhook_url, slack_webhook_url)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AuraMesh Neural DB', 'auramesh-neural-db', 'AI/ML & Automation', '11111111-1111-1111-1111-111111111111', 'HACK-7X9Q', 4, 2, ARRAY['UI/UX', 'Three.js'], 'Decentralized vector search engine optimized for edge AI devices with instant sub-10ms similarity clustering.', 'FORMING', 'https://discord.com/api/webhooks/demo/auramesh', 'https://hooks.slack.com/services/demo/auramesh'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kryptos Trust Engine', 'kryptos-trust-engine', 'FinTech & Web3', '44444444-4444-4444-4444-444444444444', 'NEO-4K2P', 4, 1, ARRAY['FastAPI', 'Rust', 'UI/UX'], 'Zero-knowledge credential verification allowing sybil-resistant voting without leaking personal identity.', 'FORMING', 'https://discord.com/api/webhooks/demo/kryptos', NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. TEAM MEMBERS SEED
INSERT INTO team_members (team_id, user_id, role_in_team)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'LEAD'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'AI_ML'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'LEAD')
ON CONFLICT (user_id) DO NOTHING;

-- 5. MENTOR HELP DESK TICKETS SEED
INSERT INTO mentor_tickets (id, team_id, requester_id, title, domain, urgency, description, room_location, table_number, status, claimed_by, resolution_notes)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Vector embedding quantization latency on mobile edge', 'AI_ML', 'HIGH', 'We are seeing quantization degradation when compressing 1536-dim embeddings to int8. Need help tuning our cosine threshold.', 'Main Arena Table 14', '14', 'RESOLVED', '55555555-5555-5555-5555-555555555555', 'Recommended product quantization (PQ) with 64 sub-vectors and asymmetric distance computation.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'CORS & WebAssembly SIMD instantiation in Chrome', 'FRONTEND', 'MEDIUM', 'Wasm thread pool fails to spawn workers with SharedArrayBuffer headers on Vercel deployment.', 'Table 28', '28', 'OPEN', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. SUBMISSIONS SEED
INSERT INTO submissions (id, team_id, project_title, tagline, description, track, github_repo_url, gitlab_repo_url, live_demo_url, commit_count, last_commit_hash, repo_verified, license_type, video_url, slides_url, diagram_url, cryptographic_receipt, is_draft, submitted_at)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AuraMesh Neural DB', 'Sub-millisecond localized vector clustering on decentralized edge nodes.', 'AuraMesh re-architects multimodal retrieval by distributing quantized vector embeddings across local edge nodes with zero cloud egress cost. Features dynamic HNSW index compression and instant fallback.', 'AI/ML & Automation', 'https://github.com/auramesh/auramesh-core', NULL, 'https://auramesh-demo.vercel.app', 42, '9f8b4a2c1d0e5f7a', true, 'Apache-2.0', 'https://youtube.com/watch?v=demo-auramesh', 'https://speakerdeck.com/auramesh/pitch-2026.pdf', 'https://auramesh.dev/architecture-v2.png', 'SHA256:7B8F9A22E14CD99A3482BE67F302941BA529DE7601FF2481A093BCF45E610A92', false, NOW())
ON CONFLICT (team_id) DO NOTHING;

-- 7. JUDGING RUBRIC SEED
INSERT INTO judging_rubrics (id, name, description, criteria, is_active)
VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Official Global Hackathon 2026 Rubric', 'Standard 4-pillar weighted evaluation rubric used for final prize deliberation.', 
  '[
    {"id": "innovation", "name": "Innovation & Originality", "weight": 0.30, "maxScore": 10, "description": "Is this a novel solution? Does it push technical boundaries?"},
    {"id": "technical_depth", "name": "Technical Depth & Complexity", "weight": 0.30, "maxScore": 10, "description": "Architectural rigor, clean codebase, effective use of advanced APIs and systems."},
    {"id": "feasibility", "name": "Real-World Feasibility & Business Value", "weight": 0.25, "maxScore": 10, "description": "Does it solve a genuine enterprise or societal pain point? Viability of adoption."},
    {"id": "ui_ux", "name": "UI/UX, Polish & Accessibility", "weight": 0.15, "maxScore": 10, "description": "Visual craft, responsiveness, ergonomics, micro-animations, and delight."}
  ]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 8. JUDGING EVALUATION SEED
INSERT INTO judging_evaluations (id, judge_id, submission_id, rubric_id, scores, raw_weighted_score, normalized_score, private_notes, is_blind_reviewed)
VALUES
  ('12121212-1212-1212-1212-121212121212', '77777777-7777-7777-7777-777777777777', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 
  '{"innovation": 9.5, "technical_depth": 9.0, "feasibility": 8.5, "ui_ux": 8.0}'::jsonb, 
  8.85, 93.40, 'Extraordinary technical depth. The quantized HNSW graph runs flawlessly on client edge devices.', false)
ON CONFLICT (judge_id, submission_id) DO NOTHING;

-- 9. EVENT SCHEDULE SEED
INSERT INTO event_schedule (id, title, description, category, start_time, end_time, location, is_delayed, delay_minutes, is_active_now, sort_order)
VALUES
  ('23232323-2323-2323-2323-232323232323', 'Opening Keynote & Challenge Briefing', 'Welcome address by hackathon directors and keynote sponsor talks.', 'CEREMONY', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours', 'Grand Auditorium', false, 0, false, 1),
  ('34343434-3434-3434-3434-343434343434', 'Hacking Period & Team Formation Lock', 'Teams must finalize their team rosters and lock invite codes.', 'MILESTONE', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours', 'Hacking Arena & Discord', false, 0, false, 2),
  ('45454545-4545-4545-4545-454545454545', 'DeepMind & Vercel Architecture Mentorship', 'One-on-one office hours with senior staff engineers and architects.', 'MENTORING', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '2 hours', 'Mentor Hub & Virtual Rooms', false, 0, true, 3),
  ('56565656-5656-5656-5656-565656565656', 'Strict Code Freeze & Submission Deadline', 'Project repository, live demo, video, and cryptographic receipts cut-off.', 'MILESTONE', NOW() + INTERVAL '6 hours', NOW() + INTERVAL '6 hours 15 minutes', 'Project Submission Portal', false, 0, false, 4),
  ('67676767-6767-6767-6767-676767676767', 'Top 10 Finalist Stage Pitches', 'Finalist demonstrations in front of grand jury and venture capital panel.', 'PITCH', NOW() + INTERVAL '8 hours', NOW() + INTERVAL '10 hours', 'Main Stage & Live Stream', false, 0, false, 5),
  ('78787878-7878-7878-7878-787878787878', 'Award Ceremony & Closing Celebration', 'Grand prize announcements, sponsor bounty winners, and network gala.', 'CEREMONY', NOW() + INTERVAL '11 hours', NOW() + INTERVAL '12 hours', 'Grand Ballroom', false, 0, false, 6)
ON CONFLICT (id) DO NOTHING;

-- 10. ANNOUNCEMENTS SEED
INSERT INTO announcements (id, title, message, urgency, target_role, author_id, is_active)
VALUES
  ('89898989-8989-8989-8989-898989898989', '⚡ AI Model Credits & Cloud Quota Boost Active', 'All verified teams now have access to high-throughput Gemini 1.5 Pro and Flash API keys in the developer portal.', 'INFO', 'ALL', '88888888-8888-8888-8888-888888888888', true),
  ('90909090-9090-9090-9090-909090909090', '⏰ Code Freeze in 6 Hours - Ensure Drafts Are Saved', 'Please verify your GitHub commit history and live demo URLs early. Cryptographic receipts will be locked at the deadline.', 'WARNING', 'PARTICIPANTS', '88888888-8888-8888-8888-888888888888', true)
ON CONFLICT (id) DO NOTHING;

-- 11. SPONSOR BOOTHS SEED
INSERT INTO sponsor_booths (id, name, tier, logo_url, booth_location, challenge_title, challenge_description, bounty_amount, tech_tags, api_docs_url, contact_mentor, website_url)
VALUES
  ('abababab-abab-abab-abab-abababababab', 'Google Cloud & DeepMind', 'TITLE', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', 'Booth #01 • Grand Foyer', 'Best Autonomous Agent with Multimodal Reasoning', 'Build an end-to-end agentic application leveraging Google Gemini and real-time tool orchestration.', '$10,000 USD', ARRAY['Gemini API', 'Vertex AI', 'Python', 'TypeScript'], 'https://ai.google.dev', 'Dr. Kavita Narang', 'https://cloud.google.com'),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'Supabase', 'PLATINUM', 'https://supabase.com/brand-assets/supabase-logo-icon.svg', 'Booth #04 • Dev Commons', 'Best Use of Realtime Data & Row-Level Security', 'Architect a secure, collaborative application utilizing Postgres triggers, realtime subscriptions, and vector embeddings.', '$5,000 USD', ARRAY['Supabase', 'PostgreSQL', 'pgvector', 'RLS'], 'https://supabase.com/docs', 'Supabase DevRel Team', 'https://supabase.com'),
  ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'Vercel', 'PLATINUM', 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png', 'Booth #07 • Edge Pavilion', 'Fastest Edge Performance & Web UI Craft', 'Deliver an instant, highly optimized web application utilizing edge middleware, Server Actions, and fluid animations.', '$5,000 USD', ARRAY['Next.js', 'Vercel Edge', 'Web Vitals'], 'https://vercel.com/docs', 'David Kim', 'https://vercel.com')
ON CONFLICT (id) DO NOTHING;

-- 12. STAGE PRESENTATION QUEUE SEED
INSERT INTO presentation_queue (id, team_id, slot_number, estimated_start, room, status, stream_url)
VALUES
  ('dededede-dede-dede-dede-dededededede', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, NOW() + INTERVAL '8 hours', 'Main Auditorium', 'SCHEDULED', 'https://live.hackingly.org/stage-1')
ON CONFLICT (slot_number) DO NOTHING;
