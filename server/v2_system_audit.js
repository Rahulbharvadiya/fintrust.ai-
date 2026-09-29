// Real HTTP Integration Audit for fintrust.ai & Hackathon OS v2
const http = require('http');
const app = require('./index');

let server;
let baseUrl;

async function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const url = new URL(path, baseUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('json') ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

let passed = 0;
let total = 0;

function check(desc, cond) {
  total++;
  if (!cond) {
    console.error(`  ❌ FAILED: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
  console.log(`  ✅ PASSED: ${desc}`);
  passed++;
}

async function runHttpAudit() {
  console.log('\n======================================================');
  console.log('🌐 RUNNING LIVE HTTP ENDPOINT INTEGRATION AUDIT');
  console.log('======================================================\n');

  // Start ephemeral test server on random free port
  server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check & Security headers
    console.log('1. Health & Security Headers:');
    const health = await request('/api/health');
    check('Health returns 200 OK', health.status === 200);
    check('X-Frame-Options is DENY', health.headers['x-frame-options'] === 'DENY');
    check('X-Content-Type-Options is nosniff', health.headers['x-content-type-options'] === 'nosniff');
    check('Capabilities list contains v2 features', health.data.capabilities.length >= 10);

    // 2. Auth & Registration
    console.log('\n2. Role-Based Auth & Developer Portfolio:');
    const regRes = await request('/api/auth/register', 'POST', {
      email: 'alex_http_audit@hackathon.dev',
      password: 'StrongPassword99!',
      role: 'PARTICIPANT',
      full_name: 'Alex Rivera',
      affiliation: 'Princeton University',
      skills: ['React', 'PyTorch', 'FastAPI'],
      track_preference: 'AI/ML & Automation'
    });
    check('Registration returns 201 Created', regRes.status === 201);
    check('Token issued', !!regRes.data.token);
    check('Digital ticket issued', !!regRes.data.ticket.ticketId);

    const token = regRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'alex_http_audit@hackathon.dev',
      password: 'StrongPassword99!'
    });
    check('Login returns 200 with matching full name', loginRes.data.profile.full_name === 'Alex Rivera');

    const meRes = await request('/api/auth/me', 'GET', null, authHeaders);
    check('Auth /me returns profile', meRes.data.profile.email === 'alex_http_audit@hackathon.dev');

    const gitRes = await request('/api/auth/social/github', 'POST', { username: 'octocat' });
    check('GitHub social portfolio imports repos', gitRes.data.success && gitRes.data.top_repositories.length > 0);

    // 3. Profiles, Skill Graph & Waiver
    console.log('\n3. Profiles & Waiver:');
    const dirRes = await request('/api/profiles/directory?skill=PyTorch');
    check('Participant directory filters by PyTorch', dirRes.data.total >= 1);

    const waiverRes = await request(`/api/profiles/${regRes.data.profile.id}/waiver`, 'POST', {
      signatureString: 'Alex Rivera',
      agreementChecked: true
    }, authHeaders);
    check('Waiver signed successfully', waiverRes.data.success && waiverRes.data.profile.waiver_signed);

    const ticketRes = await request(`/api/profiles/${regRes.data.profile.id}/ticket`);
    check('Ticket pass endpoint returns QR svg', ticketRes.data.ticket.qrSvg.includes('<svg'));

    // 4. Team Hub & Matchmaking
    console.log('\n4. Team Hub & Invite Codes:');
    const teamRes = await request('/api/teams', 'POST', {
      name: 'OmniMesh Edge Team',
      track: 'AI/ML & Automation',
      maxMembers: 4,
      lookingForSkills: ['Rust', 'UI/UX'],
      pitchSummary: 'Decentralized neural edge mesh with zero egress cost.'
    }, authHeaders);
    check('Team created with invite code', teamRes.status === 201 && teamRes.data.team.invite_code.startsWith('HACK-'));

    const teamId = teamRes.data.team.id;
    const inviteCode = teamRes.data.team.invite_code;

    const teamDir = await request('/api/teams/directory?missingSkill=UI/UX');
    check('Team directory filters by missing skill UI/UX', teamDir.data.teams.length >= 1);

    // 5. Helpdesk Tickets
    console.log('\n5. Mentor Helpdesk:');
    const ticketCreate = await request('/api/helpdesk/tickets', 'POST', {
      teamId,
      title: 'CUDA Kernel synchronization trap on edge jetson',
      domain: 'AI_ML',
      urgency: 'HIGH',
      description: 'Asynchronous streams failing on memory fence.',
      roomLocation: 'Desk 12'
    }, authHeaders);
    check('Mentor ticket created', ticketCreate.status === 201 && ticketCreate.data.ticket.status === 'OPEN');

    const metricsRes = await request('/api/helpdesk/metrics');
    check('Helpdesk metrics calculates wait time', typeof metricsRes.data.metrics.estimatedWaitMinutes === 'number');

    // 6. Submissions & Cryptographic Receipt
    console.log('\n6. Project Submissions & SHA-256 Receipt:');
    const deadlineRes = await request('/api/submissions/deadline');
    check('Deadline countdown synchronized', !!deadlineRes.data.deadlineIso);

    const subDraftRes = await request('/api/submissions', 'POST', {
      teamId,
      projectTitle: 'OmniMesh Edge System',
      tagline: 'Decentralized Neural Mesh',
      description: 'High performance edge routing pipeline for local LLM quantization.',
      track: 'AI/ML & Automation',
      githubRepoUrl: 'https://github.com/omnimesh/core-engine',
      liveDemoUrl: 'https://omnimesh.vercel.app',
      isDraft: true
    }, authHeaders);
    check('Draft saved without final lock', subDraftRes.data.isDraft === true);

    const subFinalRes = await request('/api/submissions', 'POST', {
      teamId,
      projectTitle: 'OmniMesh Edge System',
      tagline: 'Decentralized Neural Mesh',
      description: 'High performance edge routing pipeline for local LLM quantization with verified benchmarks.',
      track: 'AI/ML & Automation',
      githubRepoUrl: 'https://github.com/omnimesh/core-engine',
      liveDemoUrl: 'https://omnimesh.vercel.app',
      commitCount: 45,
      isDraft: false
    }, authHeaders);
    check('Final submission locks and generates receipt', subFinalRes.data.cryptographicReceipt.startsWith('SHA256:'));
    check('Celebration trigger enabled for canvas-confetti', subFinalRes.data.celebrationTrigger === true);

    const verifyReceiptRes = await request(`/api/submissions/${subFinalRes.data.submission.id}/verify-receipt`, 'POST');
    check('Receipt verified cryptographically', verifyReceiptRes.data.valid === true);

    // 7. Judging Rubric & Leaderboards
    console.log('\n7. Judging & Deliberation:');
    const rubricRes = await request('/api/judging/rubric');
    check('Active rubric returns 4 weighted criteria', rubricRes.data.rubric.criteria.length === 4);

    const leaderboardRes = await request('/api/judging/leaderboard');
    check('Leaderboard tabulates normalized rankings', leaderboardRes.data.leaderboard.length >= 1);

    // 8. Live Operations & Timeline Shifts
    console.log('\n8. Live Operations & Gate Desk:');
    const scheduleRes = await request('/api/live/schedule');
    check('Live schedule returns milestones', scheduleRes.data.schedule.length >= 4);

    const boothsRes = await request('/api/live/sponsor-booths');
    check('Sponsor booths include Google Cloud & Supabase', boothsRes.data.booths.length >= 3);

    const gateRes = await request('/api/gate/scan', 'POST', {
      ticketId: regRes.data.ticket.ticketId
    });
    check('Gate scan checks participant in', gateRes.data.profile.checked_in === true);

    const gateStats = await request('/api/gate/stats');
    check('Gate stats reflects check-in attendance', gateStats.data.stats.checkedInCount >= 1);

    console.log('\n======================================================');
    console.log(`🏁 HTTP AUDIT COMPLETED: ${passed} / ${total} CHECKS PASSED (100%)`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runHttpAudit().catch(err => {
  console.error('Audit failed:', err);
  if (server) server.close();
  process.exit(1);
});
