// Evaluation, Judging & Deliberation Analytics Service
const db = require('../db/databaseAdapter');

/**
 * Retrieves submissions for judge console with optional Blind Review masking
 */
async function getSubmissionsForJudge({ judgeId, track = 'ALL', blindReview = false }) {
  const submissions = await db.getAllSubmissions({ track, isDraft: false });
  const myEvals = await db.getAllEvaluations();

  return submissions.map(sub => {
    const existingEval = myEvals.find(e => e.judge_id === judgeId && e.submission_id === sub.id);
    
    if (blindReview || sub.is_blind_reviewed) {
      return {
        id: sub.id,
        track: sub.track,
        project_title: sub.project_title,
        tagline: sub.tagline,
        description: sub.description,
        github_repo_url: sub.github_repo_url,
        live_demo_url: sub.live_demo_url,
        video_url: sub.video_url,
        slides_url: sub.slides_url,
        diagram_url: sub.diagram_url,
        license_type: sub.license_type,
        // Redacted for blind review to eliminate bias:
        team_name: '🛡️ Anonymous Team (Blind Review)',
        team_members: [],
        is_blind_review_active: true,
        evaluation: existingEval || null
      };
    }

    return {
      ...sub,
      is_blind_review_active: false,
      evaluation: existingEval || null
    };
  });
}

/**
 * Generates deliberation CSV export content
 */
function generateLeaderboardCsv(leaderboardData) {
  const headers = [
    'Rank',
    'Project Title',
    'Team Name',
    'Track',
    'Normalized Score (0-100)',
    'Average Raw Score (0-10)',
    'Judge Evaluation Count',
    'Variance Discrepancy Flag',
    'Live Demo URL',
    'GitHub Repository'
  ];

  const rows = leaderboardData.map(item => [
    item.rank,
    `"${(item.project_title || '').replace(/"/g, '""')}"`,
    `"${(item.team_name || '').replace(/"/g, '""')}"`,
    `"${item.track}"`,
    item.normalized_score,
    item.average_raw_score,
    item.eval_count,
    item.variance_discrepancy ? 'YES (DELIBERATION_NEEDED)' : 'NO',
    item.live_demo_url || 'N/A',
    item.github_repo_url || 'N/A'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

module.exports = {
  getSubmissionsForJudge,
  generateLeaderboardCsv
};
