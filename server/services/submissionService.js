// Project Submission & Code Repository Pipeline Service
const crypto = require('crypto');
const db = require('../db/databaseAdapter');
const { SUBMISSION_DEADLINE_MS } = require('../config');

/**
 * Validates public Git repository URL
 */
function validateRepositoryUrl(url) {
  if (!url || typeof url !== 'string') return { valid: false, reason: 'Repository URL is required.' };
  
  const githubRegex = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
  const gitlabRegex = /^https:\/\/(www\.)?gitlab\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

  if (!githubRegex.test(url) && !gitlabRegex.test(url)) {
    return {
      valid: false,
      reason: 'URL must be a public GitHub or GitLab repository (e.g., https://github.com/org/repo).'
    };
  }

  return { valid: true };
}

/**
 * Validates live deployment URL
 */
function validateDeploymentUrl(url) {
  if (!url) return { valid: true }; // Optional for some hardware/backend tracks
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Deployment URL must be a valid HTTP or HTTPS address.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format for live deployment.' };
  }
}

/**
 * Validates and embeds presentation media (YouTube / Loom)
 */
function normalizeVideoEmbed(videoUrl) {
  if (!videoUrl) return null;
  const str = videoUrl.trim();

  // YouTube match
  const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      platform: 'YOUTUBE',
      originalUrl: str,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
    };
  }

  // Loom match
  const loomMatch = str.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      platform: 'LOOM',
      originalUrl: str,
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`
    };
  }

  return {
    platform: 'DIRECT_OR_CUSTOM',
    originalUrl: str,
    embedUrl: str
  };
}

/**
 * Generates an immutable cryptographic receipt for a submission
 */
function generateCryptographicReceipt({ teamId, projectTitle, repoUrl, commitHash, submittedAt }) {
  const payload = [
    teamId,
    projectTitle,
    repoUrl,
    commitHash || 'HEAD',
    submittedAt || Date.now()
  ].join('::');

  const hmac = crypto.createHmac('sha256', 'fintrust_submission_salt_2026')
    .update(payload)
    .digest('hex')
    .toUpperCase();

  return `SHA256:${hmac}`;
}

/**
 * Verifies a submission cryptographic receipt
 */
function verifyReceipt({ receipt, teamId, projectTitle, repoUrl, commitHash, submittedAt }) {
  if (!receipt || !receipt.startsWith('SHA256:')) return false;
  const expected = generateCryptographicReceipt({ teamId, projectTitle, repoUrl, commitHash, submittedAt });
  return receipt.trim().toUpperCase() === expected.trim().toUpperCase();
}

/**
 * Primary submission submission/draft handler
 */
async function processSubmission({
  teamId,
  projectTitle,
  tagline,
  description,
  track,
  githubRepoUrl,
  gitlabRepoUrl = null,
  liveDemoUrl = null,
  commitCount = 15,
  lastCommitHash = null,
  licenseType = 'MIT',
  videoUrl = null,
  slidesUrl = null,
  diagramUrl = null,
  galleryImages = [],
  isDraft = true,
  bypassDeadline = false
}) {
  const now = Date.now();

  // Strict deadline cutoff enforcement for non-draft submissions
  if (!isDraft && !bypassDeadline && now > SUBMISSION_DEADLINE_MS) {
    const expiredByMins = Math.round((now - SUBMISSION_DEADLINE_MS) / 60000);
    throw new Error(
      `Strict Submission Cutoff Exceeded: The submission window closed ${expiredByMins} minute(s) ago. Changes cannot be locked.`
    );
  }

  // If final submission, validate requirements
  if (!isDraft) {
    if (!projectTitle || projectTitle.trim().length < 3) {
      throw new Error('Project title is required (minimum 3 characters).');
    }
    if (!description || description.trim().length < 20) {
      throw new Error('Detailed project description is required (minimum 20 characters).');
    }

    const repoCheck = validateRepositoryUrl(githubRepoUrl);
    if (!repoCheck.valid) {
      throw new Error(repoCheck.reason);
    }

    const demoCheck = validateDeploymentUrl(liveDemoUrl);
    if (!demoCheck.valid) {
      throw new Error(demoCheck.reason);
    }
  }

  const effectiveCommitHash = lastCommitHash || crypto.randomBytes(4).toString('hex');
  const normalizedVideo = normalizeVideoEmbed(videoUrl);
  const submittedAt = isDraft ? null : new Date().toISOString();

  let receipt = null;
  if (!isDraft) {
    receipt = generateCryptographicReceipt({
      teamId,
      projectTitle,
      repoUrl: githubRepoUrl,
      commitHash: effectiveCommitHash,
      submittedAt
    });
  }

  const submission = await db.saveSubmission({
    team_id: teamId,
    project_title: projectTitle,
    tagline: tagline || 'An innovative project submitted for Hackathon 2026',
    description: description || '',
    track: track || 'AI/ML & Automation',
    github_repo_url: githubRepoUrl,
    gitlab_repo_url: gitlabRepoUrl,
    live_demo_url: liveDemoUrl,
    commit_count: commitCount || 1,
    last_commit_hash: effectiveCommitHash,
    repo_verified: true,
    license_type: licenseType,
    video_url: normalizedVideo ? normalizedVideo.embedUrl : videoUrl,
    slides_url: slidesUrl,
    diagram_url: diagramUrl,
    gallery_images: galleryImages,
    cryptographic_receipt: receipt,
    submitted_at: submittedAt,
    is_draft: isDraft
  });

  return {
    success: true,
    submission,
    cryptographicReceipt: submission.cryptographic_receipt,
    isDraft,
    celebrationTrigger: !isDraft // Frontend uses this to trigger canvas-confetti!
  };
}

module.exports = {
  validateRepositoryUrl,
  validateDeploymentUrl,
  normalizeVideoEmbed,
  generateCryptographicReceipt,
  verifyReceipt,
  processSubmission,
  getSubmissionDeadline: () => ({
    deadlineMs: SUBMISSION_DEADLINE_MS,
    deadlineIso: new Date(SUBMISSION_DEADLINE_MS).toISOString(),
    serverTimeIso: new Date().toISOString(),
    isPastDeadline: Date.now() > SUBMISSION_DEADLINE_MS
  })
};
