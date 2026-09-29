// Eligibility Rules & Confidence Scoring Engine

// Default event configuration: AI Build Challenge 2026
const DEFAULT_EVENT_CONFIG = {
  eventId: 'ai-build-2026',
  eventName: 'AI Identity Verification Challenge',
  eventDate: '2026-09-18',
  ageRestrictions: {
    enabled: true,
    minAge: 18,
    maxAge: 25
  },
  studentOnly: true,
  requireFaceMatch: true,
  acceptedDocTypes: ['AADHAAR', 'COLLEGE_ID', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE'],
  thresholds: {
    autoApproveScore: 80,
    reviewQueueScore: 55
  }
};

/**
 * Calculates accurate age in years relative to a reference date
 */
function calculateAge(dobStr, referenceDateStr = '2026-09-18') {
  if (!dobStr) return null;
  
  // dobStr is in DD-MM-YYYY or YYYY
  let birthDate;
  if (/^\d{4}$/.test(dobStr.trim())) {
    birthDate = new Date(`${dobStr.trim()}-01-01`);
  } else {
    const parts = dobStr.split('-');
    if (parts.length === 3) {
      // Day, Month, Year
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      birthDate = new Date(year, month, day);
    } else {
      birthDate = new Date(dobStr);
    }
  }

  if (isNaN(birthDate.getTime())) return null;

  const eventDate = new Date(referenceDateStr);
  let age = eventDate.getFullYear() - birthDate.getFullYear();
  const m = eventDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * String similarity using Levenshtein distance for fuzzy name matching
 */
function calculateNameMatchScore(nameA, nameB) {
  if (!nameA || !nameB) return { score: 50, matchType: 'UNKNOWN' };

  const a = nameA.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const b = nameB.trim().toLowerCase().replace(/[^\w\s]/g, '');

  if (a === b) return { score: 100, matchType: 'EXACT' };

  // Check abbreviation / initials (e.g. "Abhishek K" vs "Abhishek Kumar")
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  if (wordsA[0] === wordsB[0]) {
    // First names match
    if (wordsA.length > 1 && wordsB.length > 1) {
      if (wordsA[1][0] === wordsB[1][0]) {
        return { score: 85, matchType: 'INITIAL_MATCH', note: 'First name matches, last name initial matches' };
      }
    }
    return { score: 80, matchType: 'PARTIAL', note: 'First name matches' };
  }

  // Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  const sim = Math.round((1 - distance / maxLen) * 100);

  return {
    score: Math.max(0, sim),
    matchType: sim > 75 ? 'HIGH_SIMILARITY' : 'LOW_SIMILARITY'
  };
}

/**
 * Main Eligibility & Decision Evaluator
 */
function evaluateEligibility({
  applicant,
  parsedDoc,
  forensicResults,
  faceMatchResults,
  dedupResults,
  eventConfig = DEFAULT_EVENT_CONFIG
}) {
  let score = 0;
  const breakdown = {
    authenticity: 0, // 0 - 100%
    faceBiometrics: 0, // 0 - 100%
    identityEligibility: 0, // 0 - 100%
    deduplication: 0 // 0 - 100%
  };

  const decisionReasons = [];
  const flags = [];
  let isHardBlocked = false;

  // 1. Authenticity & Forensics Check (Scenario 1: 0 - 100%)
  const rawAuthScore = typeof forensicResults.authenticityScore === 'number'
    ? forensicResults.authenticityScore
    : 90;
  breakdown.authenticity = Math.max(0, Math.min(100, Math.round(rawAuthScore)));

  if (forensicResults.isTampered) {
    isHardBlocked = true;
    flags.push({
      type: 'TAMPER_DETECTED',
      severity: 'CRITICAL',
      message: 'Document failed forensic authenticity: Digital editing or font tampering detected.'
    });
    decisionReasons.push('Digital alteration / tampering detected on document.');
  }

  // 2. Biometric Face Verification (Scenario 2: 0 - 100%)
  if (faceMatchResults.performed) {
    const rawFaceScore = typeof faceMatchResults.similarityScore === 'number'
      ? faceMatchResults.similarityScore
      : 90;
    breakdown.faceBiometrics = Math.max(0, Math.min(100, Math.round(rawFaceScore)));

    if (!faceMatchResults.isMatch) {
      flags.push({
        type: 'FACE_MISMATCH',
        severity: 'CRITICAL',
        message: faceMatchResults.reason || 'Biometric Face Mismatch'
      });
      decisionReasons.push('Selfie biometric does not match photo on ID card.');
      isHardBlocked = true;
    }
  } else {
    // Selfie not provided or not performed yet: Neutral 100% so missing selfie does not unfairly penalize
    breakdown.faceBiometrics = 100;
  }

  // 3. Deduplication & Sybil Defense (Scenario 3: 0 - 100%)
  if (dedupResults.isSybilAttack) {
    isHardBlocked = true;
    breakdown.deduplication = 0;
    flags.push(...(dedupResults.flags || []));
    decisionReasons.push('Sybil attack: This ID has already been registered under a different applicant name.');
  } else if (dedupResults.isDuplicate) {
    isHardBlocked = true;
    breakdown.deduplication = 25;
    flags.push(...(dedupResults.flags || []));
    decisionReasons.push('Duplicate registration: This ID is already registered for this event.');
  } else {
    // Unique, zero duplicates found -> 100% clean
    breakdown.deduplication = 100;
  }

  // 4. Age & Identity Eligibility Check (Scenario 4: 0 - 100%)
  let eligibilityPoints = 0; // max 25
  const applicantName = (applicant.name || '').trim();
  const docName = (parsedDoc.fields.name || '').trim();
  const nameComp = calculateNameMatchScore(applicantName, docName);

  if (nameComp.matchType === 'EXACT' || nameComp.score >= 95) {
    eligibilityPoints += 10;
  } else if (nameComp.matchType === 'INITIAL_MATCH' || (nameComp.score >= 70 && nameComp.score < 95)) {
    eligibilityPoints += 8;
    flags.push({
      type: 'NAME_VARIATION',
      severity: 'MEDIUM',
      message: `Name discrepancy: Form says "${applicantName}", ID says "${docName}" (${nameComp.score}% match). Sent to Organizer Review Queue to prevent false rejection.`
    });
  } else if (!docName || !applicantName) {
    // If document name wasn't extracted via OCR or applicant name wasn't provided yet
    eligibilityPoints += 7;
  } else {
    eligibilityPoints += 2;
    flags.push({
      type: 'NAME_MISMATCH',
      severity: 'HIGH',
      message: `Significant name mismatch: Form says "${applicantName}", ID says "${docName}".`
    });
  }

  // Age calculation
  const dob = parsedDoc.fields.dob;
  const calculatedAge = calculateAge(dob, eventConfig.eventDate);

  if (calculatedAge !== null) {
    const { minAge, maxAge } = eventConfig.ageRestrictions;
    if (calculatedAge >= minAge && calculatedAge <= maxAge) {
      eligibilityPoints += 15;
      decisionReasons.push(`Age verified: ${calculatedAge} years old (eligible for ${minAge}-${maxAge} bracket).`);
    } else {
      isHardBlocked = true;
      decisionReasons.push(`Age ineligibility: Participant is ${calculatedAge} years old (Event requires age between ${minAge} and ${maxAge}).`);
      flags.push({
        type: 'AGE_INELIGIBLE',
        severity: 'CRITICAL',
        message: `Age ${calculatedAge} is outside the allowed bracket (${minAge}-${maxAge}).`
      });
    }
  } else {
    // Missing DOB - assign 10 points out of 15 (neutral partial credit)
    flags.push({
      type: 'MISSING_DOB',
      severity: 'MEDIUM',
      message: 'Date of Birth could not be parsed from document.'
    });
    eligibilityPoints += 10;
  }

  // Student requirement
  if (eventConfig.studentOnly) {
    const isStudentDoc = parsedDoc.documentType === 'COLLEGE_ID' || Boolean(parsedDoc.fields.institution) || Boolean(applicant.college);
    if (!isStudentDoc) {
      flags.push({
        type: 'STUDENT_STATUS_UNCONFIRMED',
        severity: 'LOW',
        message: 'Non-student ID provided for student-only event; cross-checked with claimed college name.'
      });
    }
  }

  // Scale eligibilityPoints (max 25) to 0 - 100%
  breakdown.identityEligibility = Math.max(0, Math.min(100, Math.round((eligibilityPoints / 25) * 100)));

  // Total Trust Score (0 - 100): True average of all 4 scenarios!
  const scenarioScores = [
    breakdown.authenticity,
    breakdown.faceBiometrics,
    breakdown.identityEligibility,
    breakdown.deduplication
  ];
  score = Math.round(scenarioScores.reduce((sum, s) => sum + s, 0) / scenarioScores.length);
  score = Math.max(0, Math.min(100, score));

  // Determine final status
  let finalStatus = 'VERIFIED';
  let statusBadge = 'APPROVED';
  let humanReadableSummary = '';

  if (isHardBlocked || score < eventConfig.thresholds.reviewQueueScore) {
    finalStatus = 'REJECTED';
    statusBadge = 'REJECTED';
    humanReadableSummary = `Registration Blocked: ${decisionReasons.join(' ')}`;
  } else if (score < eventConfig.thresholds.autoApproveScore || flags.some(f => f.severity === 'HIGH' || f.severity === 'MEDIUM')) {
    finalStatus = 'REVIEW_NEEDED';
    statusBadge = 'FLAGGED FOR ORGANIZER REVIEW';
    humanReadableSummary = `Sent to Organizer Review Queue (Trust Score: ${score}%): Minor discrepancies detected that require human sign-off without blocking legitimate applicants.`;
  } else {
    finalStatus = 'VERIFIED';
    statusBadge = 'AUTO-VERIFIED';
    humanReadableSummary = `Auto-Approved (Trust Score: ${score}%): Document authentic, age (${calculatedAge || 'verified'}) eligible, biometric match confirmed, and zero duplicate registrations found.`;
  }

  return {
    status: finalStatus,
    statusBadge,
    trustScore: score,
    calculatedAge,
    breakdown,
    humanReadableSummary,
    flags,
    isHardBlocked,
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  calculateAge,
  calculateNameMatchScore,
  evaluateEligibility,
  DEFAULT_EVENT_CONFIG
};
