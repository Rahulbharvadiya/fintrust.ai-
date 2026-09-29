const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Version 1 Core Forensic & Identity Verification Services
const { parseDocument } = require('./services/documentParser');
const { analyzeDocumentForensics } = require('./services/forensicEngine');
const { verifyFaceMatch } = require('./services/faceMatcher');
const dedupService = require('./services/dedupService');
const { evaluateEligibility, DEFAULT_EVENT_CONFIG } = require('./services/eligibilityEngine');
const { createMockTextractBlocks, processTextractVerification } = require('./services/textractAdapter');
const { TEST_VECTORS } = require('./services/testCases');
const awsTextractService = require('./services/realAwsService');
const geminiVisionService = require('./services/geminiVisionService');
const { generateParticipantTicket } = require('./services/ticketService');

// Version 2 Configuration, Security Middleware & Adapters
const { PORT, CORS_ORIGIN, RATE_LIMITS } = require('./config');
const { applySecurityHeaders, sanitizeRequestBody } = require('./middleware/securityMiddleware');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { checkSupabaseHealth } = require('./db/supabaseClient');
const db = require('./db/databaseAdapter');

// Version 2 Specialized Route Modules
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const teamRoutes = require('./routes/teamRoutes');
const helpdeskRoutes = require('./routes/helpdeskRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const judgingRoutes = require('./routes/judgingRoutes');
const liveOpsRoutes = require('./routes/liveOpsRoutes');
const checkInRoutes = require('./routes/checkInRoutes');

const app = express();

// 1. Security & Core Middleware
app.use(applySecurityHeaders);
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(sanitizeRequestBody);

// Rate Limiters
const generalLimiter = createRateLimiter(RATE_LIMITS.GENERAL.windowMs, RATE_LIMITS.GENERAL.max, 'general');
const authLimiter = createRateLimiter(RATE_LIMITS.AUTH.windowMs, RATE_LIMITS.AUTH.max, 'auth');
const verifyLimiter = createRateLimiter(RATE_LIMITS.VERIFY.windowMs, RATE_LIMITS.VERIFY.max, 'verify');

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/verify', verifyLimiter);

// Active event configuration state
let currentEventConfig = { ...DEFAULT_EVENT_CONFIG };

// ==============================================================================
// 2. VERSION 2 ROUTE MOUNTS
// ==============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/judging', judgingRoutes);
app.use('/api/live', liveOpsRoutes);
app.use('/api/gate', checkInRoutes);

// ==============================================================================
// 3. HEALTH CHECK & ENGINE STATUS
// ==============================================================================
app.get('/api/health', async (req, res) => {
  const supabaseHealth = await checkSupabaseHealth();
  res.json({
    status: 'ONLINE',
    service: 'fintrust.ai & Hackathon OS Live Engine',
    version: '2.0.0-production-enterprise',
    activeEvent: currentEventConfig.eventName,
    supabase: supabaseHealth,
    aiServices: {
      awsTextract: awsTextractService.getStatus(),
      geminiVision: geminiVisionService.getStatus()
    },
    capabilities: [
      'Multi-document Indian ID OCR (Aadhaar, College ID, PAN, Voter ID, DL)',
      'UIDAI Verhoeff Checksum Mathematical Validation',
      'Forensic ELA & Typography Inconsistency Anomaly Detection',
      'Sybil & Cross-Registration ID Reuse Graph',
      'Biometric Facial Landmark & Cosine Similarity Match',
      'Configurable Event Eligibility Rules Engine',
      'Multi-Tier Role-Based Authentication & Social Portfolio Import (GitHub/Google/LinkedIn)',
      'Searchable Skill Graph & Track Selection',
      'Team Matchmaking, Member Cap Enforcement & Webhook Provisioning (Discord/Slack)',
      'Live Mentor Helpdesk Ticketing Queue with Domain Routing',
      'Structured Project Submission Pipeline with Git Verification & SHA-256 Cryptographic Receipts',
      'Weighted Rubric Scoring Console with Blind Review Mode',
      'Z-Score Normalized Leaderboards & Deliberation Variance Analytics',
      'Live Operations Timeline with Schedule Shift Sync & Real-Time Announcements (SSE)',
      'Digital Cryptographic Event Pass & Gate Check-In with Legal Waiver Verification'
    ]
  });
});

// ==============================================================================
// 4. PRELOADED TEST VECTORS & AI STATUS
// ==============================================================================
app.get('/api/test-vectors', (req, res) => {
  res.json({
    success: true,
    count: TEST_VECTORS.length,
    testVectors: TEST_VECTORS
  });
});

app.get('/api/ai-status', (req, res) => {
  res.json({
    success: true,
    aws: awsTextractService.getStatus(),
    gemini: geminiVisionService.getStatus()
  });
});

app.post('/api/ai-config', (req, res) => {
  const { provider, awsAccessKeyId, awsSecretAccessKey, awsRegion, geminiApiKey } = req.body;
  
  if (provider === 'aws' && awsAccessKeyId && awsSecretAccessKey) {
    const r = awsTextractService.initClient({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: awsRegion || 'us-east-1'
    });
    return res.json(r);
  }

  if (provider === 'gemini' && geminiApiKey) {
    const r = geminiVisionService.initClient(geminiApiKey);
    return res.json(r);
  }

  res.status(400).json({ success: false, error: 'Invalid provider configuration parameters' });
});

// ==============================================================================
// 5. PRIMARY REGISTRATION & DOCUMENT FORENSIC VERIFICATION (V1 Compatibility)
// ==============================================================================
app.post('/api/verify', async (req, res) => {
  try {
    const {
      applicant = {},
      documentType = null,
      rawOcrText = null,
      documentImage = null,
      selfieImage = null,
      simulatedAnomaly = null,
      testCaseId = null
    } = req.body;

    const registrationId = `REG-${Math.floor(1000 + Math.random() * 9000)}`;

    let effectiveOcrText = rawOcrText;
    let effectiveAnomaly = simulatedAnomaly;
    let effectiveApplicant = { ...applicant };
    let effectiveDocImage = documentImage;
    let effectiveSelfie = selfieImage;

    if (testCaseId) {
      const vector = TEST_VECTORS.find(v => v.id === testCaseId);
      if (vector) {
        effectiveOcrText = vector.ocrLines.join('\n');
        effectiveAnomaly = vector.simulatedAnomaly;
        effectiveApplicant = { ...vector.applicant, ...applicant };
        effectiveDocImage = vector.documentSvg;
        effectiveSelfie = vector.selfieSvg;
      }
    }

    // 1. AWS Textract Live Cloud Call if configured
    if (awsTextractService.isConfigured && effectiveDocImage && !testCaseId) {
      const awsResult = await awsTextractService.detectDocumentText(effectiveDocImage);
      if (awsResult.source === 'AWS_TEXTRACT_LIVE') {
        const textLines = (awsResult.blocks.Blocks || [])
          .filter(b => b.BlockType === 'LINE')
          .map(b => b.Text);
        if (textLines.length > 0) {
          effectiveOcrText = textLines.join('\n');
        }
      }
    }

    // 2. Document parsing & field extraction
    const parsedDoc = parseDocument(effectiveOcrText || '', documentType);

    if (!parsedDoc.fields.idNumber && req.body.idNumber) {
      parsedDoc.fields.idNumber = req.body.idNumber;
    }
    if (!parsedDoc.fields.dob && req.body.dob) {
      parsedDoc.fields.dob = req.body.dob;
    }

    // Auto-populate applicant name from document if not explicitly provided
    if ((!effectiveApplicant.name || effectiveApplicant.name === 'Anonymous Participant') && parsedDoc.fields.name) {
      effectiveApplicant.name = parsedDoc.fields.name;
    }

    // 3. Gemini Multimodal Analysis if configured
    let geminiReport = null;
    if (geminiVisionService.isConfigured && effectiveDocImage && !testCaseId) {
      geminiReport = await geminiVisionService.analyzeWithGemini({
        documentBase64: effectiveDocImage,
        selfieBase64: effectiveSelfie,
        applicantName: effectiveApplicant.name,
        eventDetails: currentEventConfig
      });
    }

    // 4. Deep forensic inspection
    const forensicResults = analyzeDocumentForensics({
      ocrData: { text: effectiveOcrText || '' },
      docType: parsedDoc.documentType,
      parsedFields: parsedDoc.fields,
      simulatedAnomaly: effectiveAnomaly
    });

    // 5. Biometric face verification
    const faceMatchResults = verifyFaceMatch({
      idPhoto: effectiveDocImage,
      selfie: effectiveSelfie,
      simulatedAnomaly: effectiveAnomaly
    });

    // 6. Cross-registration deduplication & Sybil defense
    const dedupResults = dedupService.checkDuplicate({
      idNumber: parsedDoc.fields.idNumber,
      applicantName: effectiveApplicant.name,
      imageStr: effectiveDocImage,
      registrationId
    });

    // 7. Complete Eligibility Evaluation
    const verdict = evaluateEligibility({
      applicant: effectiveApplicant,
      parsedDoc,
      forensicResults,
      faceMatchResults,
      dedupResults,
      eventConfig: currentEventConfig
    });

    // 8. Generate Digital Event Ticket if verified
    let ticket = null;
    if (verdict.status === 'VERIFIED') {
      ticket = generateParticipantTicket({
        registrationId,
        name: effectiveApplicant.name,
        college: effectiveApplicant.college || parsedDoc.fields.institution || 'Accredited Institution',
        age: verdict.calculatedAge,
        trustScore: verdict.trustScore,
        docType: parsedDoc.documentType,
        eventName: currentEventConfig.eventName
      });
    }

    // 9. Record registration into system registry
    const record = {
      id: registrationId,
      name: effectiveApplicant.name || 'Anonymous Participant',
      email: effectiveApplicant.email || 'participant@example.com',
      phone: effectiveApplicant.phone || '+91 90000 00000',
      college: effectiveApplicant.college || parsedDoc.fields.institution || 'N/A',
      docType: parsedDoc.documentType,
      idNumber: parsedDoc.fields.idNumber || 'NOT_DETECTED',
      dob: parsedDoc.fields.dob,
      age: verdict.calculatedAge,
      status: verdict.status,
      statusBadge: verdict.statusBadge,
      trustScore: verdict.trustScore,
      scoreBreakdown: verdict.breakdown,
      decisionReason: verdict.humanReadableSummary,
      flags: verdict.flags,
      isSybilAttack: dedupResults.isSybilAttack,
      isDuplicate: dedupResults.isDuplicate,
      documentImage: effectiveDocImage,
      selfieImage: effectiveSelfie,
      forensics: forensicResults,
      biometrics: faceMatchResults,
      parsedFields: parsedDoc.fields,
      ticket,
      checkInStatus: ticket ? 'PENDING_VENUE_CHECKIN' : 'INELIGIBLE',
      geminiAnalysis: geminiReport,
      timestamp: new Date().toISOString()
    };

    dedupService.register(record);

    res.json({
      success: true,
      registration: record,
      record: record,
      verdict,
      ticket
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================================================
// 6. DROP-IN AWS TEXTRACT ADAPTER
// ==============================================================================
app.post('/api/v1/adapters/aws-textract', async (req, res) => {
  try {
    const {
      textractBlocks,
      applicant = {},
      selfieImage = null,
      documentImage = null,
      simulatedAnomaly = null
    } = req.body;

    let blocks = textractBlocks;
    if (!blocks || !blocks.Blocks) {
      if (awsTextractService.isConfigured && documentImage) {
        const awsRes = await awsTextractService.detectDocumentText(documentImage);
        blocks = awsRes.blocks;
      } else {
        blocks = createMockTextractBlocks([
          'GOVERNMENT OF INDIA',
          'Unique Identification Authority of India',
          applicant.name || 'Rohan Sharma',
          'DOB: 14/06/2005',
          'Gender: MALE',
          '5829 4832 9181'
        ]);
      }
    }

    const enriched = processTextractVerification({
      textractBlocks: blocks,
      applicant,
      selfieImage,
      documentImage,
      simulatedAnomaly,
      eventConfig: currentEventConfig
    });

    res.json(enriched);
  } catch (err) {
    console.error('AWS Textract adapter error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 7. REGISTRATIONS & ORGANIZER ACTIONS
// ==============================================================================
app.get('/api/registrations', (req, res) => {
  const { status, filter } = req.query;
  let list = dedupService.getAllRegistrations();

  if (status && status !== 'ALL') {
    list = list.filter(r => r.status === status);
  }
  if (filter === 'SYBIL') {
    list = list.filter(r => r.isSybilAttack);
  } else if (filter === 'TAMPERED') {
    list = list.filter(r => r.forensics?.isTampered);
  }

  res.json({
    success: true,
    total: list.length,
    registrations: list
  });
});

app.post('/api/registrations/:id/action', (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  let targetStatus = 'VERIFIED';
  let reason = notes || 'Manually approved by fintrust.ai Compliance Officer.';

  if (action === 'REJECT') {
    targetStatus = 'REJECTED';
    reason = notes || 'Manually rejected by fintrust.ai Compliance Officer upon document review.';
  } else if (action === 'REQUEST_REUPLOAD') {
    targetStatus = 'REVIEW_NEEDED';
    reason = notes || 'Organizer requested clearer re-upload (blur/glare or unreadable field).';
  }

  const updated = dedupService.updateRegistrationStatus(id, targetStatus, reason);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Registration not found' });
  }

  if (targetStatus === 'VERIFIED' && !updated.ticket) {
    updated.ticket = generateParticipantTicket({
      registrationId: updated.id,
      name: updated.name,
      college: updated.college,
      age: updated.age,
      trustScore: updated.trustScore,
      docType: updated.docType,
      eventName: currentEventConfig.eventName
    });
    updated.checkInStatus = 'PENDING_VENUE_CHECKIN';
  }

  res.json({
    success: true,
    message: `Registration ${id} updated to ${targetStatus}`,
    registration: updated
  });
});

// ==============================================================================
// 8. VENUE GATE CHECK-IN DESK (V1 Compatibility)
// ==============================================================================
app.post('/api/check-in/:id', (req, res) => {
  const { id } = req.params;
  const record = dedupService.getRegistrationById(id);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Registration record not found' });
  }

  if (record.status !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Participant status is ${record.status}. Only VERIFIED participants can be checked in at venue.`
    });
  }

  record.checkInStatus = 'CHECKED_IN_AT_DESK';
  record.checkedInAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Participant ${record.name} successfully checked in at fintrust.ai verified desk!`,
    record
  });
});

// ==============================================================================
// 9. EXPORTS & DASHBOARD STATS
// ==============================================================================
app.get('/api/export-csv', (req, res) => {
  const list = dedupService.getAllRegistrations();
  const headers = ['Registration ID', 'Name', 'Email', 'College', 'Doc Type', 'ID Number', 'Age', 'Trust Score', 'Status', 'Check-In Status', 'Timestamp'];
  
  const rows = list.map(r => [
    r.id,
    `"${r.name}"`,
    r.email,
    `"${r.college}"`,
    r.docType,
    r.idNumber,
    r.age ?? 'N/A',
    `${r.trustScore}%`,
    r.status,
    r.checkInStatus || 'N/A',
    r.timestamp
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fintrust_verified_roster.csv"');
  res.send(csvContent);
});

app.get('/api/stats', (req, res) => {
  const stats = dedupService.getStats();
  const list = dedupService.getAllRegistrations();
  const checkedInCount = list.filter(r => r.checkInStatus === 'CHECKED_IN_AT_DESK').length;

  res.json({
    success: true,
    stats: {
      ...stats,
      checkedInCount
    },
    aiServices: {
      aws: awsTextractService.getStatus(),
      gemini: geminiVisionService.getStatus()
    },
    eventConfig: currentEventConfig
  });
});

app.get('/api/event-config', (req, res) => {
  res.json({ success: true, config: currentEventConfig });
});

app.put('/api/event-config', (req, res) => {
  currentEventConfig = { ...currentEventConfig, ...req.body };
  res.json({
    success: true,
    message: 'Event rules updated successfully',
    config: currentEventConfig
  });
});

app.post('/api/reset-demo', (req, res) => {
  dedupService.registrations = [];
  dedupService.idIndex.clear();
  dedupService.imageHashIndex.clear();
  dedupService.seedInitialData();
  db.seedInitialData();
  currentEventConfig = { ...DEFAULT_EVENT_CONFIG };

  res.json({
    success: true,
    message: 'System database and seed records restored to clean initial state.'
  });
});

// Central 404 handler for undefined API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.path}`
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Internal Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

// Only start the server if executed directly (e.g. node server/index.js)
// When imported as a serverless function (Vercel), app is exported without port collision
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[fintrust.ai & Hackathon OS v2] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
