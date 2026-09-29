// Unified High-Efficiency Database Adapter
// Connects seamlessly to Supabase PostgreSQL when credentials exist,
// or provides a lightning-fast, zero-dependency in-memory store matching the exact schema.

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { supabase, isConfigured } = require('./supabaseClient');

class DatabaseAdapter {
  constructor() {
    this.useSupabase = isConfigured;
    this.memoryStore = {
      profiles: new Map(),
      teams: new Map(),
      team_members: new Map(),
      team_invites_requests: new Map(),
      mentor_tickets: new Map(),
      mentor_profiles: new Map(),
      submissions: new Map(),
      judging_rubrics: new Map(),
      judging_evaluations: new Map(),
      event_schedule: new Map(),
      announcements: new Map(),
      sponsor_booths: new Map(),
      presentation_queue: new Map()
    };

    this.seedInitialData();
  }

  seedInitialData() {
    // Clear maps
    Object.values(this.memoryStore).forEach(map => map.clear());

    // 1. Seed Profiles
    const seedProfiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'aravind@hackathon.dev',
        role: 'PARTICIPANT',
        full_name: 'Aravind Swaminathan',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        github_username: 'aravind-dev',
        portfolio_url: 'https://aravind.codes',
        bio: 'Fullstack engineer & distributed systems researcher.',
        affiliation: 'IIT Madras',
        skills: ['Go', 'React', 'Docker', 'PostgreSQL', 'Kubernetes'],
        track_preference: 'AI/ML & Automation',
        dietary_requirements: 'Vegetarian',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'Aravind Swaminathan',
        waiver_signed_at: new Date(Date.now() - 3600000).toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-2026-001',
        trust_score: 98,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'priya.sharma@hackathon.dev',
        role: 'PARTICIPANT',
        full_name: 'Priya Sharma',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        github_username: 'priyasharma-ai',
        portfolio_url: 'https://priyasharma.io',
        bio: 'Computer Vision & Deep Learning specialist.',
        affiliation: 'BITS Pilani',
        skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'OpenCV'],
        track_preference: 'AI/ML & Automation',
        dietary_requirements: 'Vegan',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'Priya Sharma',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-2026-002',
        trust_score: 96,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'marcus.vance@hackathon.dev',
        role: 'PARTICIPANT',
        full_name: 'Marcus Vance',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        github_username: 'marcusvance',
        portfolio_url: 'https://marcusvance.design',
        bio: 'Product designer obsessed with micro-interactions and high-craft design.',
        affiliation: 'Rhode Island School of Design',
        skills: ['Figma', 'UI/UX', 'TailwindCSS', 'Three.js', 'React'],
        track_preference: 'FinTech & Web3',
        dietary_requirements: 'Gluten-Free',
        accessibility_needs: null,
        looking_for_team: true,
        waiver_signed: true,
        waiver_signature: 'Marcus Vance',
        waiver_signed_at: new Date().toISOString(),
        checked_in: false,
        check_in_timestamp: null,
        ticket_id: 'TCK-2026-003',
        trust_score: 94,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'elena.rostova@hackathon.dev',
        role: 'PARTICIPANT',
        full_name: 'Elena Rostova',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        github_username: 'erostova',
        portfolio_url: 'https://elena.tech',
        bio: 'Rust & Solana systems engineer.',
        affiliation: 'Stanford University',
        skills: ['Rust', 'Solidity', 'WebAssembly', 'TypeScript'],
        track_preference: 'FinTech & Web3',
        dietary_requirements: 'Standard',
        accessibility_needs: null,
        looking_for_team: true,
        waiver_signed: true,
        waiver_signature: 'Elena Rostova',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-2026-004',
        trust_score: 99,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'dr.kavita@google.com',
        role: 'MENTOR',
        full_name: 'Dr. Kavita Narang',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        github_username: 'knarang-google',
        portfolio_url: 'https://kavitanarang.ai',
        bio: 'Staff AI Research Scientist at Google DeepMind. Specialized in Multimodal LLMs & Agents.',
        affiliation: 'Google DeepMind',
        skills: ['PyTorch', 'Gemini API', 'Transformers', 'JAX'],
        track_preference: 'AI/ML & Automation',
        dietary_requirements: 'Vegetarian',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'Dr. Kavita Narang',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-MENTOR-01',
        trust_score: 100,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'david.kim@vercel.com',
        role: 'MENTOR',
        full_name: 'David Kim',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        github_username: 'davidkim-edge',
        portfolio_url: 'https://davidkim.sh',
        bio: 'Edge Infrastructure Architect & Next.js Core Contributor.',
        affiliation: 'Vercel',
        skills: ['Next.js', 'Vercel Edge', 'Supabase', 'Serverless', 'TypeScript'],
        track_preference: 'Open Innovation',
        dietary_requirements: 'Standard',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'David Kim',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-MENTOR-02',
        trust_score: 100,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'sarah.connor@ycombinator.com',
        role: 'JUDGE',
        full_name: 'Sarah Connor',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        github_username: 'sconnor-yc',
        portfolio_url: 'https://sarahconnor.vc',
        bio: 'Partner at Y Combinator. Looking for breakthrough developer infrastructure & AI applications.',
        affiliation: 'Y Combinator',
        skills: ['Venture Capital', 'Product Market Fit', 'System Architecture'],
        track_preference: 'AI/ML & Automation',
        dietary_requirements: 'Standard',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'Sarah Connor',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-JUDGE-01',
        trust_score: 100,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        email: 'vikram.mehta@hackathon.org',
        role: 'ORGANIZER',
        full_name: 'Vikram Mehta',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        github_username: 'vmehta-lead',
        portfolio_url: 'https://hackingly.org',
        bio: 'Lead Hackathon Director & Community Architect.',
        affiliation: 'Hackingly Global',
        skills: ['Event Operations', 'Community', 'Platform Engineering'],
        track_preference: 'All Tracks',
        dietary_requirements: 'Standard',
        accessibility_needs: null,
        looking_for_team: false,
        waiver_signed: true,
        waiver_signature: 'Vikram Mehta',
        waiver_signed_at: new Date().toISOString(),
        checked_in: true,
        check_in_timestamp: new Date().toISOString(),
        ticket_id: 'TCK-ORG-01',
        trust_score: 100,
        verification_status: 'VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    seedProfiles.forEach(p => this.memoryStore.profiles.set(p.id, p));

    // 2. Seed Mentor Profiles
    const seedMentors = [
      {
        user_id: '55555555-5555-5555-5555-555555555555',
        domains: ['AI_ML', 'CLOUD_DEVOPS'],
        is_available: true,
        current_location: 'Mentor Hub • Booth 03 (DeepMind)',
        contact_handle: '@kavita_google',
        total_tickets_resolved: 14,
        average_rating: 4.95,
        updated_at: new Date().toISOString()
      },
      {
        user_id: '66666666-6666-6666-6666-666666666666',
        domains: ['FRONTEND', 'BACKEND', 'CLOUD_DEVOPS'],
        is_available: true,
        current_location: 'Main Floor • Vercel Lounge',
        contact_handle: '@david_edge',
        total_tickets_resolved: 19,
        average_rating: 4.98,
        updated_at: new Date().toISOString()
      }
    ];
    seedMentors.forEach(m => this.memoryStore.mentor_profiles.set(m.user_id, m));

    // 3. Seed Teams
    const team1 = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'AuraMesh Neural DB',
      slug: 'auramesh-neural-db',
      track: 'AI/ML & Automation',
      leader_id: '11111111-1111-1111-1111-111111111111',
      invite_code: 'HACK-7X9Q',
      max_members: 4,
      current_members_count: 2,
      looking_for_skills: ['UI/UX', 'Three.js'],
      pitch_summary: 'Decentralized vector search engine optimized for edge AI devices with instant sub-10ms similarity clustering.',
      status: 'FORMING',
      discord_webhook_url: 'https://discord.com/api/webhooks/demo/auramesh',
      slack_webhook_url: 'https://hooks.slack.com/services/demo/auramesh',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString()
    };
    const team2 = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Kryptos Trust Engine',
      slug: 'kryptos-trust-engine',
      track: 'FinTech & Web3',
      leader_id: '44444444-4444-4444-4444-444444444444',
      invite_code: 'NEO-4K2P',
      max_members: 4,
      current_members_count: 1,
      looking_for_skills: ['FastAPI', 'Rust', 'UI/UX'],
      pitch_summary: 'Zero-knowledge credential verification allowing sybil-resistant voting without leaking personal identity.',
      status: 'FORMING',
      discord_webhook_url: 'https://discord.com/api/webhooks/demo/kryptos',
      slack_webhook_url: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.memoryStore.teams.set(team1.id, team1);
    this.memoryStore.teams.set(team2.id, team2);

    // 4. Seed Team Members
    const members = [
      { id: uuidv4(), team_id: team1.id, user_id: '11111111-1111-1111-1111-111111111111', role_in_team: 'LEAD', joined_at: new Date().toISOString() },
      { id: uuidv4(), team_id: team1.id, user_id: '22222222-2222-2222-2222-222222222222', role_in_team: 'AI_ML', joined_at: new Date().toISOString() },
      { id: uuidv4(), team_id: team2.id, user_id: '44444444-4444-4444-4444-444444444444', role_in_team: 'LEAD', joined_at: new Date().toISOString() }
    ];
    members.forEach(m => this.memoryStore.team_members.set(m.id, m));

    // 5. Seed Mentor Helpdesk Tickets
    const ticket1 = {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      team_id: team1.id,
      requester_id: '11111111-1111-1111-1111-111111111111',
      title: 'Vector embedding quantization latency on mobile edge',
      domain: 'AI_ML',
      urgency: 'HIGH',
      description: 'We are seeing quantization degradation when compressing 1536-dim embeddings to int8. Need help tuning our cosine threshold.',
      room_location: 'Main Arena Table 14',
      table_number: '14',
      status: 'RESOLVED',
      claimed_by: '55555555-5555-5555-5555-555555555555',
      resolution_notes: 'Recommended product quantization (PQ) with 64 sub-vectors and asymmetric distance computation.',
      created_at: new Date(Date.now() - 5400000).toISOString(),
      claimed_at: new Date(Date.now() - 4800000).toISOString(),
      resolved_at: new Date(Date.now() - 3600000).toISOString()
    };
    const ticket2 = {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      team_id: team2.id,
      requester_id: '44444444-4444-4444-4444-444444444444',
      title: 'CORS & WebAssembly SIMD instantiation in Chrome',
      domain: 'FRONTEND',
      urgency: 'MEDIUM',
      description: 'Wasm thread pool fails to spawn workers with SharedArrayBuffer headers on Vercel deployment.',
      room_location: 'Table 28',
      table_number: '28',
      status: 'OPEN',
      claimed_by: null,
      resolution_notes: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      claimed_at: null,
      resolved_at: null
    };
    this.memoryStore.mentor_tickets.set(ticket1.id, ticket1);
    this.memoryStore.mentor_tickets.set(ticket2.id, ticket2);

    // 6. Seed Submissions
    const sub1 = {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      team_id: team1.id,
      project_title: 'AuraMesh Neural DB',
      tagline: 'Sub-millisecond localized vector clustering on decentralized edge nodes.',
      description: 'AuraMesh re-architects multimodal retrieval by distributing quantized vector embeddings across local edge nodes with zero cloud egress cost. Features dynamic HNSW index compression and instant fallback.',
      track: 'AI/ML & Automation',
      github_repo_url: 'https://github.com/auramesh/auramesh-core',
      gitlab_repo_url: null,
      live_demo_url: 'https://auramesh-demo.vercel.app',
      commit_count: 42,
      last_commit_hash: '9f8b4a2c1d0e5f7a',
      repo_verified: true,
      license_type: 'Apache-2.0',
      video_url: 'https://youtube.com/watch?v=demo-auramesh',
      slides_url: 'https://speakerdeck.com/auramesh/pitch-2026.pdf',
      diagram_url: 'https://auramesh.dev/architecture-v2.png',
      gallery_images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'
      ],
      cryptographic_receipt: 'SHA256:7B8F9A22E14CD99A3482BE67F302941BA529DE7601FF2481A093BCF45E610A92',
      is_draft: false,
      submitted_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.memoryStore.submissions.set(sub1.id, sub1);

    // 7. Seed Judging Rubrics
    const rubric1 = {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      name: 'Official Global Hackathon 2026 Rubric',
      description: 'Standard 4-pillar weighted evaluation rubric used for final prize deliberation.',
      criteria: [
        { id: 'innovation', name: 'Innovation & Originality', weight: 0.30, maxScore: 10, description: 'Novel solution pushing technical boundaries.' },
        { id: 'technical_depth', name: 'Technical Depth & Execution', weight: 0.30, maxScore: 10, description: 'Architectural rigor, clean code, effective API utilization.' },
        { id: 'feasibility', name: 'Real-World Feasibility & Business Value', weight: 0.25, maxScore: 10, description: 'Viability of adoption and genuine impact.' },
        { id: 'ui_ux', name: 'UI/UX Polish & Accessibility', weight: 0.15, maxScore: 10, description: 'Design craft, responsiveness, and micro-interactions.' }
      ],
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.memoryStore.judging_rubrics.set(rubric1.id, rubric1);

    // 8. Seed Judging Evaluation
    const eval1 = {
      id: '12121212-1212-1212-1212-121212121212',
      judge_id: '77777777-7777-7777-7777-777777777777',
      submission_id: sub1.id,
      rubric_id: rubric1.id,
      scores: {
        innovation: 9.5,
        technical_depth: 9.0,
        feasibility: 8.5,
        ui_ux: 8.0
      },
      raw_weighted_score: 8.85,
      normalized_score: 93.40,
      private_notes: 'Extraordinary technical depth. The quantized HNSW graph runs flawlessly on client edge devices.',
      is_blind_reviewed: false,
      submitted_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.memoryStore.judging_evaluations.set(eval1.id, eval1);

    // 9. Seed Event Schedule
    const scheduleItems = [
      {
        id: '23232323-2323-2323-2323-232323232323',
        title: 'Opening Keynote & Challenge Briefing',
        description: 'Welcome address by hackathon directors and keynote sponsor talks.',
        category: 'CEREMONY',
        start_time: new Date(Date.now() - 12 * 3600000).toISOString(),
        end_time: new Date(Date.now() - 11 * 3600000).toISOString(),
        location: 'Grand Auditorium',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: false,
        sort_order: 1
      },
      {
        id: '34343434-3434-3434-3434-343434343434',
        title: 'Hacking Period & Team Formation Lock',
        description: 'Teams must finalize their team rosters and lock invite codes.',
        category: 'MILESTONE',
        start_time: new Date(Date.now() - 10 * 3600000).toISOString(),
        end_time: new Date(Date.now() - 9 * 3600000).toISOString(),
        location: 'Hacking Arena & Discord',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: false,
        sort_order: 2
      },
      {
        id: '45454545-4545-4545-4545-454545454545',
        title: 'DeepMind & Vercel Architecture Mentorship',
        description: 'One-on-one office hours with senior staff engineers and architects.',
        category: 'MENTORING',
        start_time: new Date(Date.now() - 4 * 3600000).toISOString(),
        end_time: new Date(Date.now() + 2 * 3600000).toISOString(),
        location: 'Mentor Hub & Virtual Rooms',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: true,
        sort_order: 3
      },
      {
        id: '56565656-5656-5656-5656-565656565656',
        title: 'Strict Code Freeze & Submission Deadline',
        description: 'Project repository, live demo, video, and cryptographic receipts cut-off.',
        category: 'MILESTONE',
        start_time: new Date(Date.now() + 6 * 3600000).toISOString(),
        end_time: new Date(Date.now() + 6.25 * 3600000).toISOString(),
        location: 'Project Submission Portal',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: false,
        sort_order: 4
      },
      {
        id: '67676767-6767-6767-6767-676767676767',
        title: 'Top 10 Finalist Stage Pitches',
        description: 'Finalist demonstrations in front of grand jury and venture capital panel.',
        category: 'PITCH',
        start_time: new Date(Date.now() + 8 * 3600000).toISOString(),
        end_time: new Date(Date.now() + 10 * 3600000).toISOString(),
        location: 'Main Stage & Live Stream',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: false,
        sort_order: 5
      },
      {
        id: '78787878-7878-7878-7878-787878787878',
        title: 'Award Ceremony & Closing Celebration',
        description: 'Grand prize announcements, sponsor bounty winners, and network gala.',
        category: 'CEREMONY',
        start_time: new Date(Date.now() + 11 * 3600000).toISOString(),
        end_time: new Date(Date.now() + 12 * 3600000).toISOString(),
        location: 'Grand Ballroom',
        is_delayed: false,
        delay_minutes: 0,
        is_active_now: false,
        sort_order: 6
      }
    ];
    scheduleItems.forEach(s => this.memoryStore.event_schedule.set(s.id, s));

    // 10. Seed Announcements
    const announcements = [
      {
        id: '89898989-8989-8989-8989-898989898989',
        title: '⚡ AI Model Credits & Cloud Quota Boost Active',
        message: 'All verified teams now have access to high-throughput Gemini 1.5 Pro and Flash API keys in the developer portal.',
        urgency: 'INFO',
        target_role: 'ALL',
        author_id: '88888888-8888-8888-8888-888888888888',
        is_active: true,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '90909090-9090-9090-9090-909090909090',
        title: '⏰ Code Freeze in 6 Hours - Ensure Drafts Are Saved',
        message: 'Please verify your GitHub commit history and live demo URLs early. Cryptographic receipts will be locked at the deadline.',
        urgency: 'WARNING',
        target_role: 'PARTICIPANTS',
        author_id: '88888888-8888-8888-8888-888888888888',
        is_active: true,
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    announcements.forEach(a => this.memoryStore.announcements.set(a.id, a));

    // 11. Seed Sponsor Booths
    const booths = [
      {
        id: 'abababab-abab-abab-abab-abababababab',
        name: 'Google Cloud & DeepMind',
        tier: 'TITLE',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        booth_location: 'Booth #01 • Grand Foyer',
        challenge_title: 'Best Autonomous Agent with Multimodal Reasoning',
        challenge_description: 'Build an end-to-end agentic application leveraging Google Gemini and real-time tool orchestration.',
        bounty_amount: '$10,000 USD',
        tech_tags: ['Gemini API', 'Vertex AI', 'Python', 'TypeScript'],
        api_docs_url: 'https://ai.google.dev',
        contact_mentor: 'Dr. Kavita Narang',
        website_url: 'https://cloud.google.com'
      },
      {
        id: 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc',
        name: 'Supabase',
        tier: 'PLATINUM',
        logo_url: 'https://supabase.com/brand-assets/supabase-logo-icon.svg',
        booth_location: 'Booth #04 • Dev Commons',
        challenge_title: 'Best Use of Realtime Data & Row-Level Security',
        challenge_description: 'Architect a secure, collaborative application utilizing Postgres triggers, realtime subscriptions, and vector embeddings.',
        bounty_amount: '$5,000 USD',
        tech_tags: ['Supabase', 'PostgreSQL', 'pgvector', 'RLS'],
        api_docs_url: 'https://supabase.com/docs',
        contact_mentor: 'Supabase DevRel Team',
        website_url: 'https://supabase.com'
      },
      {
        id: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd',
        name: 'Vercel',
        tier: 'PLATINUM',
        logo_url: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
        booth_location: 'Booth #07 • Edge Pavilion',
        challenge_title: 'Fastest Edge Performance & Web UI Craft',
        challenge_description: 'Deliver an instant, highly optimized web application utilizing edge middleware, Server Actions, and fluid animations.',
        bounty_amount: '$5,000 USD',
        tech_tags: ['Next.js', 'Vercel Edge', 'Web Vitals'],
        api_docs_url: 'https://vercel.com/docs',
        contact_mentor: 'David Kim',
        website_url: 'https://vercel.com'
      }
    ];
    booths.forEach(b => this.memoryStore.sponsor_booths.set(b.id, b));

    // 12. Seed Presentation Queue
    const queueItem = {
      id: 'dededede-dede-dede-dede-dededededede',
      team_id: team1.id,
      slot_number: 1,
      estimated_start: new Date(Date.now() + 8 * 3600000).toISOString(),
      room: 'Main Auditorium',
      status: 'SCHEDULED',
      stream_url: 'https://live.hackingly.org/stage-1'
    };
    this.memoryStore.presentation_queue.set(queueItem.id, queueItem);
  }

  // ============================================================================
  // PROFILES OPERATIONS
  // ============================================================================
  async getProfileById(id) {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
    return this.memoryStore.profiles.get(id) || null;
  }

  async getProfileByEmail(email) {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).single();
      if (!error && data) return data;
    }
    for (const p of this.memoryStore.profiles.values()) {
      if (p.email.toLowerCase() === email.toLowerCase()) return p;
    }
    return null;
  }

  async findProfiles({ role, skill, lookingForTeam, search, limit = 50, offset = 0 } = {}) {
    let list = Array.from(this.memoryStore.profiles.values());

    if (role) {
      list = list.filter(p => p.role.toUpperCase() === role.toUpperCase());
    }
    if (lookingForTeam !== undefined) {
      list = list.filter(p => p.looking_for_team === Boolean(lookingForTeam));
    }
    if (skill) {
      const sLower = skill.toLowerCase();
      list = list.filter(p => (p.skills || []).some(s => s.toLowerCase().includes(sLower)));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.full_name.toLowerCase().includes(q) ||
        (p.affiliation && p.affiliation.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.skills || []).some(s => s.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);
    return { total, profiles: paginated };
  }

  async upsertProfile(profileData) {
    const id = profileData.id || uuidv4();
    const existing = await this.getProfileById(id) || {};
    const updated = {
      ...existing,
      ...profileData,
      id,
      email: (profileData.email || existing.email || '').toLowerCase(),
      skills: profileData.skills || existing.skills || [],
      updated_at: new Date().toISOString()
    };
    if (!existing.created_at) updated.created_at = new Date().toISOString();

    if (this.useSupabase) {
      try {
        await supabase.from('profiles').upsert(updated);
      } catch (e) {
        console.warn('Supabase upsertProfile fallback to in-memory:', e.message);
      }
    }
    this.memoryStore.profiles.set(id, updated);
    return updated;
  }

  // ============================================================================
  // TEAMS OPERATIONS
  // ============================================================================
  async getTeamById(id) {
    if (this.useSupabase) {
      const { data } = await supabase.from('teams').select('*').eq('id', id).single();
      if (data) return data;
    }
    return this.memoryStore.teams.get(id) || null;
  }

  async getTeamByInviteCode(inviteCode) {
    if (this.useSupabase) {
      const { data } = await supabase.from('teams').select('*').eq('invite_code', inviteCode.toUpperCase()).single();
      if (data) return data;
    }
    for (const t of this.memoryStore.teams.values()) {
      if (t.invite_code.toUpperCase() === inviteCode.toUpperCase()) return t;
    }
    return null;
  }

  async getTeamByLeaderId(leaderId) {
    for (const t of this.memoryStore.teams.values()) {
      if (t.leader_id === leaderId) return t;
    }
    return null;
  }

  async findTeams({ track, missingSkill, status, hasOpenings, limit = 50, offset = 0 } = {}) {
    let list = Array.from(this.memoryStore.teams.values());

    if (track && track !== 'ALL') {
      list = list.filter(t => t.track.toLowerCase() === track.toLowerCase());
    }
    if (status) {
      list = list.filter(t => t.status === status);
    }
    if (hasOpenings) {
      list = list.filter(t => t.current_members_count < t.max_members);
    }
    if (missingSkill) {
      const ms = missingSkill.toLowerCase();
      list = list.filter(t => (t.looking_for_skills || []).some(s => s.toLowerCase().includes(ms)));
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    // Enrich with members info
    const enriched = paginated.map(team => {
      const members = this.getTeamMembers(team.id);
      return {
        ...team,
        members,
        openSpots: Math.max(0, team.max_members - team.current_members_count)
      };
    });

    return { total, teams: enriched };
  }

  async createTeam(teamData) {
    const id = teamData.id || uuidv4();
    const invite_code = teamData.invite_code || `HACK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const slug = (teamData.name || 'team').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);

    const newTeam = {
      id,
      name: teamData.name,
      slug,
      track: teamData.track || 'AI/ML & Automation',
      leader_id: teamData.leader_id,
      invite_code,
      max_members: teamData.max_members || 4,
      current_members_count: 1,
      looking_for_skills: teamData.looking_for_skills || [],
      pitch_summary: teamData.pitch_summary || '',
      status: 'FORMING',
      discord_webhook_url: teamData.discord_webhook_url || null,
      slack_webhook_url: teamData.slack_webhook_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.memoryStore.teams.set(id, newTeam);

    // Add leader as team member
    if (teamData.leader_id) {
      const memberRecord = {
        id: uuidv4(),
        team_id: id,
        user_id: teamData.leader_id,
        role_in_team: 'LEAD',
        joined_at: new Date().toISOString()
      };
      this.memoryStore.team_members.set(memberRecord.id, memberRecord);

      // Update profile looking_for_team
      const profile = this.memoryStore.profiles.get(teamData.leader_id);
      if (profile) profile.looking_for_team = false;
    }

    return newTeam;
  }

  getTeamMembers(teamId) {
    const records = Array.from(this.memoryStore.team_members.values()).filter(m => m.team_id === teamId);
    return records.map(m => {
      const prof = this.memoryStore.profiles.get(m.user_id) || {};
      return {
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        role_in_team: m.role_in_team,
        joined_at: m.joined_at,
        name: prof.full_name || 'Member',
        email: prof.email,
        avatar_url: prof.avatar_url,
        github_username: prof.github_username,
        skills: prof.skills || []
      };
    });
  }

  async getUserTeam(userId) {
    const memberEntry = Array.from(this.memoryStore.team_members.values()).find(m => m.user_id === userId);
    if (!memberEntry) return null;
    const team = this.memoryStore.teams.get(memberEntry.team_id);
    if (!team) return null;
    return {
      ...team,
      userRoleInTeam: memberEntry.role_in_team,
      members: this.getTeamMembers(team.id)
    };
  }

  async addMemberToTeam({ teamId, userId, roleInTeam = 'FULLSTACK' }) {
    const team = this.memoryStore.teams.get(teamId);
    if (!team) throw new Error('Team not found');

    if (team.current_members_count >= team.max_members) {
      throw new Error(`Team capacity reached. Maximum allowed members is ${team.max_members}`);
    }

    // Check if user is already in any team
    const alreadyInTeam = Array.from(this.memoryStore.team_members.values()).some(m => m.user_id === userId);
    if (alreadyInTeam) {
      throw new Error('User is already registered in a team. A participant cannot join multiple teams.');
    }

    const memberRecord = {
      id: uuidv4(),
      team_id: teamId,
      user_id: userId,
      role_in_team: roleInTeam,
      joined_at: new Date().toISOString()
    };
    this.memoryStore.team_members.set(memberRecord.id, memberRecord);

    team.current_members_count += 1;
    team.updated_at = new Date().toISOString();

    const prof = this.memoryStore.profiles.get(userId);
    if (prof) prof.looking_for_team = false;

    return {
      success: true,
      team,
      member: memberRecord
    };
  }

  async removeMemberFromTeam({ teamId, userId }) {
    const team = this.memoryStore.teams.get(teamId);
    if (!team) throw new Error('Team not found');

    const entry = Array.from(this.memoryStore.team_members.values()).find(m => m.team_id === teamId && m.user_id === userId);
    if (!entry) throw new Error('Member not found in this team');

    if (team.leader_id === userId && team.current_members_count > 1) {
      throw new Error('Team leader cannot leave without transferring leadership or disbanding.');
    }

    this.memoryStore.team_members.delete(entry.id);
    team.current_members_count = Math.max(0, team.current_members_count - 1);

    const prof = this.memoryStore.profiles.get(userId);
    if (prof) prof.looking_for_team = true;

    return { success: true };
  }

  // ============================================================================
  // TEAM INVITES & JOIN REQUESTS
  // ============================================================================
  async createInviteOrRequest({ teamId, userId, type, message }) {
    const id = uuidv4();
    const entry = {
      id,
      team_id: teamId,
      user_id: userId,
      type, // 'INVITE' or 'REQUEST'
      status: 'PENDING',
      message: message || (type === 'INVITE' ? 'We would love to have you on our team!' : 'Hi, I would like to join your team!'),
      created_at: new Date().toISOString()
    };
    this.memoryStore.team_invites_requests.set(id, entry);
    return entry;
  }

  async respondToInviteOrRequest(id, action) {
    const entry = this.memoryStore.team_invites_requests.get(id);
    if (!entry) throw new Error('Invite or request not found');

    entry.status = action; // 'ACCEPTED' or 'REJECTED'
    entry.responded_at = new Date().toISOString();

    if (action === 'ACCEPTED') {
      await this.addMemberToTeam({ teamId: entry.team_id, userId: entry.user_id });
    }

    return entry;
  }

  // ============================================================================
  // MENTOR HELP DESK OPERATIONS
  // ============================================================================
  async createMentorTicket(ticketData) {
    const id = uuidv4();
    const ticket = {
      id,
      team_id: ticketData.team_id,
      requester_id: ticketData.requester_id,
      title: ticketData.title,
      domain: ticketData.domain || 'GENERAL_BLOCKER',
      urgency: ticketData.urgency || 'MEDIUM',
      description: ticketData.description,
      room_location: ticketData.room_location || 'Main Arena',
      table_number: ticketData.table_number || 'N/A',
      status: 'OPEN',
      claimed_by: null,
      resolution_notes: null,
      created_at: new Date().toISOString(),
      claimed_at: null,
      resolved_at: null
    };

    this.memoryStore.mentor_tickets.set(id, ticket);
    return ticket;
  }

  async getMentorTickets({ status, domain, teamId } = {}) {
    let list = Array.from(this.memoryStore.mentor_tickets.values());

    if (status && status !== 'ALL') {
      list = list.filter(t => t.status === status);
    }
    if (domain && domain !== 'ALL') {
      list = list.filter(t => t.domain === domain);
    }
    if (teamId) {
      list = list.filter(t => t.team_id === teamId);
    }

    // Enrich with team & mentor names
    return list.map(t => {
      const team = this.memoryStore.teams.get(t.team_id);
      const mentor = t.claimed_by ? this.memoryStore.profiles.get(t.claimed_by) : null;
      const requester = this.memoryStore.profiles.get(t.requester_id);
      return {
        ...t,
        team_name: team ? team.name : 'Unknown Team',
        requester_name: requester ? requester.full_name : 'Participant',
        mentor_name: mentor ? mentor.full_name : null
      };
    });
  }

  async claimMentorTicket(ticketId, mentorId) {
    const ticket = this.memoryStore.mentor_tickets.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status !== 'OPEN') throw new Error(`Cannot claim ticket in ${ticket.status} status`);

    ticket.status = 'CLAIMED';
    ticket.claimed_by = mentorId;
    ticket.claimed_at = new Date().toISOString();
    return ticket;
  }

  async resolveMentorTicket(ticketId, mentorId, notes) {
    const ticket = this.memoryStore.mentor_tickets.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.status = 'RESOLVED';
    ticket.resolution_notes = notes || 'Resolved with team at venue.';
    ticket.resolved_at = new Date().toISOString();

    // Increment mentor stats
    const mentorProfile = this.memoryStore.mentor_profiles.get(mentorId);
    if (mentorProfile) {
      mentorProfile.total_tickets_resolved += 1;
    }

    return ticket;
  }

  async getAllMentors() {
    const list = Array.from(this.memoryStore.mentor_profiles.values());
    return list.map(m => {
      const prof = this.memoryStore.profiles.get(m.user_id) || {};
      return {
        ...m,
        full_name: prof.full_name,
        email: prof.email,
        avatar_url: prof.avatar_url,
        affiliation: prof.affiliation,
        skills: prof.skills || []
      };
    });
  }

  // ============================================================================
  // PROJECT SUBMISSION OPERATIONS
  // ============================================================================
  async saveSubmission(subData) {
    const teamId = subData.team_id;
    let existing = null;
    for (const s of this.memoryStore.submissions.values()) {
      if (s.team_id === teamId) {
        existing = s;
        break;
      }
    }

    const id = existing ? existing.id : uuidv4();
    const is_draft = subData.is_draft !== undefined ? Boolean(subData.is_draft) : true;

    // Use passed cryptographic_receipt or generate if non-draft
    let cryptographic_receipt = subData.cryptographic_receipt || existing?.cryptographic_receipt || null;
    if (!is_draft && !cryptographic_receipt) {
      const receiptPayload = [
        teamId,
        subData.project_title,
        subData.github_repo_url,
        subData.last_commit_hash || 'HEAD',
        subData.submitted_at || Date.now()
      ].join('::');
      const hash = crypto.createHmac('sha256', 'fintrust_submission_salt_2026').update(receiptPayload).digest('hex').toUpperCase();
      cryptographic_receipt = `SHA256:${hash}`;
    }

    const record = {
      ...(existing || {}),
      ...subData,
      id,
      team_id: teamId,
      is_draft,
      cryptographic_receipt,
      submitted_at: is_draft ? null : (subData.submitted_at || existing?.submitted_at || new Date().toISOString()),
      updated_at: new Date().toISOString()
    };
    if (!existing) record.created_at = new Date().toISOString();

    this.memoryStore.submissions.set(id, record);

    // If submitted, update team status
    if (!is_draft) {
      const team = this.memoryStore.teams.get(teamId);
      if (team) team.status = 'SUBMITTED';
    }

    return record;
  }

  async getSubmissionByTeamId(teamId) {
    for (const s of this.memoryStore.submissions.values()) {
      if (s.team_id === teamId) return s;
    }
    return null;
  }

  async getSubmissionById(id) {
    return this.memoryStore.submissions.get(id) || null;
  }

  async getAllSubmissions({ track, isDraft = false } = {}) {
    let list = Array.from(this.memoryStore.submissions.values());
    if (isDraft !== undefined) {
      list = list.filter(s => s.is_draft === Boolean(isDraft));
    }
    if (track && track !== 'ALL') {
      list = list.filter(s => s.track.toLowerCase() === track.toLowerCase());
    }

    return list.map(sub => {
      const team = this.memoryStore.teams.get(sub.team_id);
      return {
        ...sub,
        team_name: team ? team.name : 'Unknown Team',
        team_members: team ? this.getTeamMembers(team.id) : []
      };
    });
  }

  // ============================================================================
  // JUDGING & Z-SCORE NORMALIZATION
  // ============================================================================
  async getActiveRubric() {
    for (const r of this.memoryStore.judging_rubrics.values()) {
      if (r.is_active) return r;
    }
    return Array.from(this.memoryStore.judging_rubrics.values())[0] || null;
  }

  async submitJudgeEvaluation(evalData) {
    const judgeId = evalData.judge_id;
    const submissionId = evalData.submission_id;

    // Check if evaluation already exists for this judge & submission
    let existing = null;
    for (const e of this.memoryStore.judging_evaluations.values()) {
      if (e.judge_id === judgeId && e.submission_id === submissionId) {
        existing = e;
        break;
      }
    }

    const id = existing ? existing.id : uuidv4();
    const rubric = await this.getActiveRubric();

    // Calculate raw weighted score
    let rawWeightedScore = 0;
    const scores = evalData.scores || {};
    if (rubric && rubric.criteria) {
      rubric.criteria.forEach(c => {
        const val = parseFloat(scores[c.id]) || 0;
        rawWeightedScore += val * c.weight;
      });
    } else {
      rawWeightedScore = Object.values(scores).reduce((a, b) => a + (parseFloat(b) || 0), 0) / (Object.keys(scores).length || 1);
    }

    const evaluation = {
      id,
      judge_id: judgeId,
      submission_id: submissionId,
      rubric_id: rubric ? rubric.id : null,
      scores,
      raw_weighted_score: parseFloat(rawWeightedScore.toFixed(2)),
      normalized_score: null, // Computed during tabulation
      private_notes: evalData.private_notes || '',
      is_blind_reviewed: Boolean(evalData.is_blind_reviewed),
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.memoryStore.judging_evaluations.set(id, evaluation);
    return evaluation;
  }

  async getAllEvaluations() {
    return Array.from(this.memoryStore.judging_evaluations.values());
  }

  /**
   * Z-Score Variance Normalization Algorithm for Judge Pools
   * Eliminates harsh vs lenient judge biases across deliberation pools
   */
  calculateNormalizedLeaderboard({ track } = {}) {
    const allEvals = Array.from(this.memoryStore.judging_evaluations.values());
    const judgeStats = new Map(); // judgeId -> { mean, stdDev, count, scores }

    // 1. Group scores per judge
    allEvals.forEach(e => {
      if (!judgeStats.has(e.judge_id)) {
        judgeStats.set(e.judge_id, []);
      }
      judgeStats.get(e.judge_id).push(e.raw_weighted_score);
    });

    // 2. Compute Mean & StdDev per judge
    const judgeParameters = new Map();
    judgeStats.forEach((scoresList, judgeId) => {
      const n = scoresList.length;
      const mean = scoresList.reduce((a, b) => a + b, 0) / n;
      const variance = scoresList.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
      const stdDev = Math.sqrt(variance);
      judgeParameters.set(judgeId, { mean, stdDev, count: n });
    });

    // 3. Normalize individual scores: Z = (X - mean) / stdDev, Scaled to 0-100 (50 + Z*15)
    allEvals.forEach(e => {
      const stats = judgeParameters.get(e.judge_id);
      if (stats && stats.stdDev > 0) {
        const z = (e.raw_weighted_score - stats.mean) / stats.stdDev;
        // Map Z [-2.5, +2.5] -> [12.5, 87.5] centered at 50, clamped [0, 100]
        e.normalized_score = Math.min(100, Math.max(0, parseFloat((50 + z * 16).toFixed(2))));
      } else {
        // If single score or zero variance, scale raw (assuming 0-10 scale -> 0-100)
        e.normalized_score = parseFloat((e.raw_weighted_score * 10).toFixed(2));
      }
    });

    // 4. Group by submission
    const submissionScores = new Map(); // subId -> array of evals
    allEvals.forEach(e => {
      if (!submissionScores.has(e.submission_id)) {
        submissionScores.set(e.submission_id, []);
      }
      submissionScores.get(e.submission_id).push(e);
    });

    // 5. Build Leaderboard table
    let leaderboard = [];
    const submissions = Array.from(this.memoryStore.submissions.values()).filter(s => !s.is_draft);

    submissions.forEach(sub => {
      if (track && track !== 'ALL' && sub.track.toLowerCase() !== track.toLowerCase()) {
        return;
      }

      const evals = submissionScores.get(sub.id) || [];
      const team = this.memoryStore.teams.get(sub.team_id);

      if (evals.length === 0) {
        leaderboard.push({
          submission_id: sub.id,
          project_title: sub.project_title,
          team_name: team ? team.name : 'Unknown',
          track: sub.track,
          eval_count: 0,
          average_raw_score: 0,
          normalized_score: 0,
          variance_discrepancy: false,
          discrepancy_score: 0,
          evaluations: []
        });
        return;
      }

      const rawAvg = evals.reduce((a, b) => a + b.raw_weighted_score, 0) / evals.length;
      const normAvg = evals.reduce((a, b) => a + b.normalized_score, 0) / evals.length;

      // Calculate discrepancy (variance across judges)
      const rawScores = evals.map(e => e.raw_weighted_score);
      const minScore = Math.min(...rawScores);
      const maxScore = Math.max(...rawScores);
      const spread = maxScore - minScore;
      const isDiscrepancy = evals.length >= 2 && spread >= 2.5; // Significant disagreement flag

      leaderboard.push({
        submission_id: sub.id,
        project_title: sub.project_title,
        team_name: team ? team.name : 'Unknown',
        track: sub.track,
        live_demo_url: sub.live_demo_url,
        github_repo_url: sub.github_repo_url,
        eval_count: evals.length,
        average_raw_score: parseFloat(rawAvg.toFixed(2)),
        normalized_score: parseFloat(normAvg.toFixed(2)),
        variance_discrepancy: isDiscrepancy,
        discrepancy_score: parseFloat(spread.toFixed(2)),
        evaluations: evals.map(ev => {
          const j = this.memoryStore.profiles.get(ev.judge_id);
          return {
            judge_name: j ? j.full_name : 'Judge',
            raw_score: ev.raw_weighted_score,
            normalized_score: ev.normalized_score,
            notes: ev.private_notes
          };
        })
      });
    });

    // Rank by normalized score descending
    leaderboard.sort((a, b) => b.normalized_score - a.normalized_score);
    leaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    return {
      totalSubmissions: leaderboard.length,
      evaluatedSubmissions: leaderboard.filter(l => l.eval_count > 0).length,
      leaderboard,
      judgePoolMetrics: Array.from(judgeParameters.entries()).map(([judgeId, params]) => {
        const j = this.memoryStore.profiles.get(judgeId);
        return {
          judge_name: j ? j.full_name : 'Unknown Judge',
          evaluations_done: params.count,
          average_raw_given: parseFloat(params.mean.toFixed(2)),
          standard_deviation: parseFloat(params.stdDev.toFixed(2))
        };
      })
    };
  }

  // ============================================================================
  // LIVE OPERATIONS, SCHEDULE & ANNOUNCEMENTS
  // ============================================================================
  getSchedule() {
    const list = Array.from(this.memoryStore.event_schedule.values());
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return list;
  }

  shiftScheduleTimeline(minutes, reason = 'Organizer schedule shift') {
    const shiftMs = minutes * 60 * 1000;
    const schedule = this.getSchedule();

    schedule.forEach(item => {
      const start = new Date(item.start_time).getTime();
      const end = new Date(item.end_time).getTime();
      item.start_time = new Date(start + shiftMs).toISOString();
      item.end_time = new Date(end + shiftMs).toISOString();
      item.is_delayed = true;
      item.delay_minutes += minutes;
    });

    // Also broadcast announcement automatically
    const announcement = {
      id: uuidv4(),
      title: `⏱️ Event Schedule Shift: +${minutes} Minutes`,
      message: `The event timeline has been shifted by ${minutes} minutes. ${reason}. All subsequent milestones are adjusted automatically.`,
      urgency: 'WARNING',
      target_role: 'ALL',
      author_id: '88888888-8888-8888-8888-888888888888',
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.memoryStore.announcements.set(announcement.id, announcement);

    return { schedule, announcement };
  }

  getAnnouncements({ limit = 20 } = {}) {
    const list = Array.from(this.memoryStore.announcements.values()).filter(a => a.is_active);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.slice(0, limit);
  }

  createAnnouncement(annData) {
    const id = uuidv4();
    const entry = {
      id,
      title: annData.title,
      message: annData.message,
      urgency: annData.urgency || 'INFO',
      target_role: annData.target_role || 'ALL',
      author_id: annData.author_id,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.memoryStore.announcements.set(id, entry);
    return entry;
  }

  getSponsorBooths() {
    return Array.from(this.memoryStore.sponsor_booths.values());
  }

  getPresentationQueue() {
    const list = Array.from(this.memoryStore.presentation_queue.values());
    list.sort((a, b) => a.slot_number - b.slot_number);
    return list.map(item => {
      const team = this.memoryStore.teams.get(item.team_id);
      return {
        ...item,
        team_name: team ? team.name : 'Unknown Team'
      };
    });
  }

  updateQueueStatus(slotNumber, status) {
    for (const q of this.memoryStore.presentation_queue.values()) {
      if (q.slot_number === parseInt(slotNumber, 10)) {
        q.status = status;
        return q;
      }
    }
    throw new Error(`Presentation slot ${slotNumber} not found`);
  }
}

// Singleton database adapter instance
const db = new DatabaseAdapter();

module.exports = db;
