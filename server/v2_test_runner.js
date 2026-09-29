// Comprehensive Automated Test Suite for fintrust.ai & Hackathon OS v2.0
const assert = require('assert');
const crypto = require('crypto');
const db = require('./db/databaseAdapter');
const authService = require('./services/authService');
const teamService = require('./services/teamService');
const helpdeskService = require('./services/helpdeskService');
const submissionService = require('./services/submissionService');
const judgingService = require('./services/judgingService');
const { signEventWaiver, processVenueGateCheckIn } = require('./services/checkInService');
const { sanitizeInput } = require('./middleware/securityMiddleware');
const { SlidingWindowRateLimiter } = require('./middleware/rateLimiter');
const { createAuthToken } = require('./services/authService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

let passedTests = 0;
let totalTests = 0;

async function test(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runV2Tests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING HACKATHON OS VERSION 2.0 ENTERPRISE TEST SUITE');
  console.log('======================================================\n');

  // 1. Role-Based Authentication & Social Auth
  console.log('1. Multi-Tier Role-Based Authentication & Social Portfolios:');
  
  await test('Registers participant with skill tags and issues JWT token', async () => {
    const reg = await authService.registerUser({
      email: 'test_hacker_v2@hackathon.dev',
      password: 'SecurePassword123!',
      role: 'PARTICIPANT',
      full_name: 'Devin Hacker',
      affiliation: 'Carnegie Mellon University',
      skills: ['React', 'Go', 'PyTorch', 'Docker'],
      track_preference: 'AI/ML & Automation',
      dietary_requirements: 'Vegetarian'
    });

    assert.strictEqual(reg.profile.role, 'PARTICIPANT');
    assert.strictEqual(reg.profile.full_name, 'Devin Hacker');
    assert.ok(reg.token, 'JWT token must be generated');
    assert.ok(reg.ticket.ticketId, 'Digital ticket pass must be issued');

    const decoded = jwt.verify(reg.token, JWT_SECRET);
    assert.strictEqual(decoded.email, 'test_hacker_v2@hackathon.dev');
    assert.strictEqual(decoded.role, 'PARTICIPANT');
  });

  await test('Rejects duplicate email registration', async () => {
    let errorThrown = false;
    try {
      await authService.registerUser({
        email: 'test_hacker_v2@hackathon.dev',
        full_name: 'Devin Duplicate'
      });
    } catch {
      errorThrown = true;
    }
    assert.strictEqual(errorThrown, true, 'Should reject already-registered email');
  });

  await test('Imports GitHub developer profile with repo and skill inference', async () => {
    const gitProfile = await authService.importGitHubProfile('torvalds');
    assert.strictEqual(gitProfile.success, true);
    assert.strictEqual(gitProfile.platform, 'GITHUB');
    assert.ok(gitProfile.top_repositories.length > 0);
    assert.ok(gitProfile.detected_skills.includes('Git'));
  });

  // 2. Skill Graph & Directory Search
  console.log('\n2. Skill Graph & Directory Search:');
  
  await test('Filters participant showcase by skill tag (PyTorch)', async () => {
    const res = await db.findProfiles({ skill: 'PyTorch' });
    assert.ok(res.total >= 1);
    const hasSkill = res.profiles.every(p => p.skills.some(s => s.toLowerCase().includes('pytorch')));
    assert.strictEqual(hasSkill, true);
  });

  await test('Filters looking-for-team solo hackers', async () => {
    const res = await db.findProfiles({ lookingForTeam: true });
    assert.ok(res.total >= 1);
    const allLooking = res.profiles.every(p => p.looking_for_team === true);
    assert.strictEqual(allLooking, true);
  });

  // 3. Digital Check-In, QR Passes & Waivers
  console.log('\n3. Digital Check-In & Cryptographic Passes:');

  await test('Signs legal event safety and IP waiver', async () => {
    const hacker = await db.getProfileByEmail('test_hacker_v2@hackathon.dev');
    const result = await signEventWaiver({
      userId: hacker.id,
      signatureString: 'Devin Hacker',
      agreementChecked: true
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.profile.waiver_signed, true);
  });

  await test('Performs instant venue gate check-in for confirmed participant', async () => {
    const hacker = await db.getProfileByEmail('test_hacker_v2@hackathon.dev');
    const checkIn = await processVenueGateCheckIn({
      ticketIdOrUserId: hacker.ticket_id
    });
    assert.strictEqual(checkIn.success, true);
    assert.strictEqual(checkIn.alreadyCheckedIn, false);
    assert.strictEqual(checkIn.profile.checked_in, true);
  });

  await test('Flags already-checked-in participant on repeated gate scan', async () => {
    const hacker = await db.getProfileByEmail('test_hacker_v2@hackathon.dev');
    const checkIn = await processVenueGateCheckIn({
      ticketIdOrUserId: hacker.ticket_id
    });
    assert.strictEqual(checkIn.alreadyCheckedIn, true);
  });

  // 4. Team Formation & Collaboration Engine
  console.log('\n4. Team Formation, Capacity Caps & Webhooks:');

  let testTeamId = null;
  let testInviteCode = null;

  await test('Creates team with member cap, looking-for-skills, and webhook payloads', async () => {
    const leader = await authService.registerUser({
      email: 'lead_engineer@hackathon.dev',
      full_name: 'Zoe Thorne',
      affiliation: 'UC Berkeley',
      skills: ['TypeScript', 'Solidity']
    });

    const team = await teamService.createTeam({
      name: 'Quantum Ledger AI',
      track: 'FinTech & Web3',
      leaderId: leader.profile.id,
      maxMembers: 3,
      lookingForSkills: ['Rust', 'UI/UX'],
      pitchSummary: 'Sub-second decentralized credit scoring oracle using zero-knowledge proofs.',
      discordWebhookUrl: 'https://discord.com/api/webhooks/demo/quantum',
      slackWebhookUrl: 'https://hooks.slack.com/services/demo/quantum'
    });

    testTeamId = team.id;
    testInviteCode = team.invite_code;

    assert.strictEqual(team.name, 'Quantum Ledger AI');
    assert.strictEqual(team.max_members, 3);
    assert.strictEqual(team.current_members_count, 1);
    assert.ok(team.invite_code.startsWith('HACK-'));
  });

  await test('Adds member using 6-character secret invite code', async () => {
    const newMember = await authService.registerUser({
      email: 'rust_dev@hackathon.dev',
      full_name: 'Liam Chen',
      skills: ['Rust', 'WebAssembly']
    });

    const joinResult = await teamService.joinTeamWithInviteCode({
      inviteCode: testInviteCode,
      userId: newMember.profile.id,
      roleInTeam: 'BACKEND'
    });

    assert.strictEqual(joinResult.success, true);
    assert.strictEqual(joinResult.team.current_members_count, 2);
  });

  await test('Enforces maximum team capacity cap (blocks exceeding max members)', async () => {
    // Add 3rd member (at max capacity 3)
    const m3 = await authService.registerUser({
      email: 'designer_m3@hackathon.dev',
      full_name: 'Alex Design',
      skills: ['UI/UX', 'Figma']
    });
    await teamService.joinTeamWithInviteCode({
      inviteCode: testInviteCode,
      userId: m3.profile.id,
      roleInTeam: 'DESIGN'
    });

    // Try adding 4th member
    const m4 = await authService.registerUser({
      email: 'overflow_m4@hackathon.dev',
      full_name: 'Sam Overflow',
      skills: ['Go']
    });

    let capacityErrorThrown = false;
    try {
      await teamService.joinTeamWithInviteCode({
        inviteCode: testInviteCode,
        userId: m4.profile.id
      });
    } catch (err) {
      capacityErrorThrown = true;
      assert.ok(err.message.includes('capacity'));
    }

    assert.strictEqual(capacityErrorThrown, true, 'Capacity cap must be strictly enforced');
  });

  await test('Filters looking-for-team directory by missing skills', async () => {
    const res = await db.findTeams({ missingSkill: 'Three.js' });
    assert.ok(res.total >= 1);
    const hasMissingSkill = res.teams.some(t => (t.looking_for_skills || []).includes('Three.js'));
    assert.strictEqual(hasMissingSkill, true);
  });

  // 5. Mentor Helpdesk Queue
  console.log('\n5. Mentor Helpdesk Queue & Live Support:');

  let ticketId = null;

  await test('Creates domain-specific mentor guidance ticket', async () => {
    const leader = await db.getProfileByEmail('lead_engineer@hackathon.dev');
    const ticket = await helpdeskService.createTicket({
      teamId: testTeamId,
      requesterId: leader.id,
      title: 'Rust WASM memory leak in browser thread pool',
      domain: 'FRONTEND',
      urgency: 'HIGH',
      description: 'SharedArrayBuffer allocated in web worker is not being garbage collected.',
      roomLocation: 'Main Arena Table 19',
      tableNumber: '19'
    });

    ticketId = ticket.id;
    assert.strictEqual(ticket.status, 'OPEN');
    assert.strictEqual(ticket.domain, 'FRONTEND');
    assert.strictEqual(ticket.urgency, 'HIGH');
  });

  await test('Mentor claims ticket from live queue', async () => {
    const mentorId = '66666666-6666-6666-6666-666666666666'; // David Kim
    const claimed = await db.claimMentorTicket(ticketId, mentorId);
    assert.strictEqual(claimed.status, 'CLAIMED');
    assert.strictEqual(claimed.claimed_by, mentorId);
  });

  await test('Mentor marks ticket resolved with notes', async () => {
    const mentorId = '66666666-6666-6666-6666-666666666666';
    const resolved = await db.resolveMentorTicket(ticketId, mentorId, 'Added manual transfer of ArrayBuffer ownership to worker pool.');
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.ok(resolved.resolution_notes.includes('ownership'));
  });

  await test('Calculates real-time helpdesk queue metrics and wait time', async () => {
    const metrics = await helpdeskService.getQueueMetrics();
    assert.ok(metrics.totalTickets >= 2);
    assert.ok(metrics.resolvedTickets >= 2);
    assert.ok(typeof metrics.estimatedWaitMinutes === 'number');
  });

  // 6. Project Submission & Cryptographic Receipt
  console.log('\n6. Project Submission & Cryptographic Receipts:');

  let submissionId = null;

  await test('Saves draft submission without locking', async () => {
    const sub = await submissionService.processSubmission({
      teamId: testTeamId,
      projectTitle: 'Quantum Ledger AI',
      tagline: 'Zero Knowledge Credit Oracles on WebAssembly',
      description: 'Quantum Ledger combines client-side zero-knowledge proofs with high-throughput WASM kernels.',
      track: 'FinTech & Web3',
      githubRepoUrl: 'https://github.com/quantum/quantum-ledger',
      liveDemoUrl: 'https://quantum-ledger.vercel.app',
      commitCount: 28,
      isDraft: true
    });

    submissionId = sub.submission.id;
    assert.strictEqual(sub.isDraft, true);
    assert.strictEqual(sub.celebrationTrigger, false);
  });

  await test('Locks final submission and generates SHA-256 HMAC cryptographic receipt', async () => {
    const finalSub = await submissionService.processSubmission({
      teamId: testTeamId,
      projectTitle: 'Quantum Ledger AI',
      tagline: 'Zero Knowledge Credit Oracles on WebAssembly',
      description: 'Quantum Ledger combines client-side zero-knowledge proofs with high-throughput WASM kernels to enable verifiable credit score calculations without leaking borrower assets.',
      track: 'FinTech & Web3',
      githubRepoUrl: 'https://github.com/quantum/quantum-ledger',
      liveDemoUrl: 'https://quantum-ledger.vercel.app',
      commitCount: 34,
      lastCommitHash: 'd3f78a1b',
      isDraft: false
    });

    assert.strictEqual(finalSub.isDraft, false);
    assert.strictEqual(finalSub.celebrationTrigger, true);
    assert.ok(finalSub.cryptographicReceipt.startsWith('SHA256:'));

    // Verify receipt independently
    const isValid = submissionService.verifyReceipt({
      receipt: finalSub.cryptographicReceipt,
      teamId: testTeamId,
      projectTitle: 'Quantum Ledger AI',
      repoUrl: 'https://github.com/quantum/quantum-ledger',
      commitHash: 'd3f78a1b',
      submittedAt: finalSub.submission.submitted_at
    });
    assert.strictEqual(isValid, true, 'Cryptographic receipt must verify successfully');
  });

  // 7. Judging Rubrics, Blind Review & Z-Score Normalization
  console.log('\n7. Judging Rubric Scoring & Z-Score Normalization:');

  await test('Fetches active 4-pillar weighted rubric', async () => {
    const rubric = await db.getActiveRubric();
    assert.strictEqual(rubric.name, 'Official Global Hackathon 2026 Rubric');
    assert.strictEqual(rubric.criteria.length, 4);
    const totalWeight = rubric.criteria.reduce((a, b) => a + b.weight, 0);
    assert.strictEqual(parseFloat(totalWeight.toFixed(2)), 1.0);
  });

  await test('Anonymizes team information during Blind Review mode', async () => {
    const blindList = await judgingService.getSubmissionsForJudge({
      judgeId: '77777777-7777-7777-7777-777777777777',
      blindReview: true
    });
    assert.ok(blindList.length >= 1);
    blindList.forEach(s => {
      assert.strictEqual(s.team_name, '🛡️ Anonymous Team (Blind Review)');
      assert.strictEqual(s.team_members.length, 0);
    });
  });

  await test('Submits judge evaluation and computes raw weighted score', async () => {
    const judgeId = '77777777-7777-7777-7777-777777777777'; // Sarah Connor
    const evaluation = await db.submitJudgeEvaluation({
      judge_id: judgeId,
      submission_id: submissionId,
      scores: {
        innovation: 9.0,        // 9.0 * 0.30 = 2.70
        technical_depth: 9.5,   // 9.5 * 0.30 = 2.85
        feasibility: 8.5,       // 8.5 * 0.25 = 2.125
        ui_ux: 9.0              // 9.0 * 0.15 = 1.35  -> Sum = 9.025 ≈ 9.03
      },
      private_notes: 'Exceptional zero-knowledge implementation. High production feasibility.'
    });

    assert.ok(evaluation.raw_weighted_score >= 8.9 && evaluation.raw_weighted_score <= 9.1);
  });

  await test('Calculates Z-score normalized leaderboard and detects scoring variance', async () => {
    const analytics = db.calculateNormalizedLeaderboard();
    assert.ok(analytics.leaderboard.length >= 2);
    assert.strictEqual(analytics.leaderboard[0].rank, 1);
    assert.ok(typeof analytics.leaderboard[0].normalized_score === 'number');
    assert.ok(analytics.judgePoolMetrics.length >= 1);
  });

  // 8. Live Operations & Schedule Shifts
  console.log('\n8. Live Operations & Timeline Shifts:');

  await test('Shifts schedule by +30 minutes and automatically broadcasts alert', async () => {
    const beforeSchedule = db.getSchedule();
    const originalStart = new Date(beforeSchedule[0].start_time).getTime();

    const shiftRes = db.shiftScheduleTimeline(30, 'Keynote technical setup adjustment');
    const afterSchedule = db.getSchedule();
    const newStart = new Date(afterSchedule[0].start_time).getTime();

    assert.strictEqual(newStart - originalStart, 30 * 60 * 1000);
    assert.strictEqual(afterSchedule[0].delay_minutes, 30);
    assert.ok(shiftRes.announcement.title.includes('+30 Minutes'));
  });

  await test('Updates stage presentation queue status (WAITING -> PRESENTING)', async () => {
    const updated = db.updateQueueStatus(1, 'PRESENTING');
    assert.strictEqual(updated.status, 'PRESENTING');
  });

  // 9. Security Middleware (Sanitization & Rate Limiting)
  console.log('\n9. Security Defense: Sanitization & Rate Limiter:');

  await test('Sanitizer strips prototype pollution attempts and dangerous script injection', () => {
    const maliciousPayload = {
      name: 'Normal Name',
      comment: 'Hello <script>alert("hacked")</script> World',
      __proto__: { admin: true },
      nested: {
        constructor: 'Bad',
        clean: 'Safe'
      }
    };

    const cleaned = sanitizeInput(maliciousPayload);
    assert.strictEqual(cleaned.name, 'Normal Name');
    assert.strictEqual(cleaned.comment, 'Hello  World');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, '__proto__'), false);
    assert.strictEqual(cleaned.nested.constructor === 'Bad', false);
    assert.strictEqual(cleaned.nested.clean, 'Safe');
  });

  await test('Sliding window rate limiter permits within quota and blocks on limit breach', () => {
    const limiter = new SlidingWindowRateLimiter(1000, 3, 'test_unit');
    const mw = limiter.middleware();

    let blocked = false;
    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        if (code === 429) blocked = true;
        return { json: () => {} };
      }
    };
    const req = { headers: {}, socket: { remoteAddress: '10.0.0.1' } };

    // Request 1, 2, 3: allowed
    mw(req, mockRes, () => {});
    mw(req, mockRes, () => {});
    mw(req, mockRes, () => {});
    assert.strictEqual(blocked, false, 'First 3 requests should be permitted');

    // Request 4: blocked
    mw(req, mockRes, () => {});
    assert.strictEqual(blocked, true, '4th request must be rate limited with 429');
  });

  console.log('\n======================================================');
  console.log(`🏁 FINISHED V2 TEST SUITE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runV2Tests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
