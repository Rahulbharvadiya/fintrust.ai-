// Judging Console, Blind Reviews, Weighted Rubrics & Normalized Leaderboards
import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, Sliders, CheckCircle2, 
  Download, AlertTriangle, TrendingUp, ExternalLink
} from 'lucide-react';
import type { JudgingRubric, LeaderboardEntry, Submission } from '../types';

export const JudgingConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'evaluate'>('leaderboard');
  const [rubric, setRubric] = useState<JudgingRubric | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [blindReview, setBlindReview] = useState<boolean>(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [scores, setScores] = useState<{ [criterionId: string]: number }>({
    innovation: 9.0,
    technical_depth: 8.5,
    feasibility: 8.0,
    ui_ux: 9.0
  });
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [rubricRes, leaderRes, subsRes] = await Promise.all([
        fetch('/api/judging/rubric'),
        fetch('/api/judging/leaderboard'),
        fetch(`/api/submissions?isDraft=false`)
      ]);

      const rData = await rubricRes.json();
      const lData = await leaderRes.json();
      const sData = await subsRes.json();

      if (rData.success) setRubric(rData.rubric);
      if (lData.success) setLeaderboard(lData.leaderboard);
      if (sData.success) {
        setSubmissions(sData.submissions);
        if (!selectedSub && sData.submissions.length > 0) {
          setSelectedSub(sData.submissions[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [blindReview]);

  const calculateWeightedTotal = () => {
    if (!rubric || !rubric.criteria) return 8.5;
    let total = 0;
    rubric.criteria.forEach(c => {
      const val = scores[c.id] || 0;
      total += val * c.weight;
    });
    return parseFloat(total.toFixed(2));
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/judging/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          scores,
          privateNotes,
          isBlindReviewed: blindReview
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg('Evaluation & scores submitted! Leaderboard updated with Z-Score normalization.');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/judging/export-csv', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Header Controls: Tab Toggle & Blind Review Switch */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('leaderboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'leaderboard' ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === 'leaderboard' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={15} />
            <span>Normalized Leaderboard ({leaderboard.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluate')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'evaluate' ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === 'evaluate' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Sliders size={15} />
            <span>Rubric Evaluation Console</span>
          </button>
        </div>

        {/* Blind Review & CSV Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setBlindReview(!blindReview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: blindReview ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
              backgroundColor: blindReview ? 'var(--brand-glow)' : 'var(--bg-surface-subtle)',
              color: blindReview ? 'var(--brand-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Mask team names and affiliations to eliminate judging bias"
          >
            {blindReview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>Blind Review Mode: {blindReview ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Download size={14} /> Export Deliberation CSV
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--status-ok-bg)',
          color: 'var(--status-ok-text)',
          border: '1px solid var(--status-ok-border)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 1. LEADERBOARD & DELIBERATION VIEW */}
      {activeTab === 'leaderboard' && (
        <div className="card-base" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Z-Score Adjusted Leaderboard</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Scores are mathematically normalized to adjust for variance between harsh and lenient judge pools.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px', width: '60px' }}>Rank</th>
                  <th style={{ padding: '12px 18px' }}>Project & Team</th>
                  <th style={{ padding: '12px 18px' }}>Track</th>
                  <th style={{ padding: '12px 18px' }}>Raw Score</th>
                  <th style={{ padding: '12px 18px' }}>Normalized Score</th>
                  <th style={{ padding: '12px 18px' }}>Evaluations</th>
                  <th style={{ padding: '12px 18px' }}>Deliberation Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.submission_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: item.rank === 1 ? '#FEF08A' : item.rank === 2 ? '#E2E8F0' : item.rank === 3 ? '#FED7AA' : 'var(--bg-surface-subtle)',
                        color: item.rank <= 3 ? '#713F12' : 'var(--text-muted)',
                        fontWeight: 800,
                        fontSize: '12px'
                      }}>
                        {item.rank}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.project_title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {blindReview ? '🛡️ Anonymous Team (Blind Review)' : item.team_name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
                        {item.track}
                      </span>
                    </td>
                    <td className="machine-data" style={{ padding: '14px 18px', fontWeight: 600 }}>
                      {item.average_raw_score} / 10
                    </td>
                    <td className="machine-data" style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '14px' }}>
                      {item.normalized_score} / 100
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.eval_count} judge(s)</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {item.variance_discrepancy ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#EF4444',
                          backgroundColor: 'var(--status-danger-bg)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          <AlertTriangle size={12} /> High Variance ({item.discrepancy_score})
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          ✓ Consistent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RUBRIC SCORING CONSOLE */}
      {activeTab === 'evaluate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Submission Selector List */}
          <div className="card-base" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
              Select Submission to Evaluate
            </h4>
            {submissions.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSub(s)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedSub?.id === s.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedSub?.id === s.id ? 'var(--brand-glow)' : 'var(--bg-surface-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {s.project_title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {blindReview ? '🛡️ Anonymous Team' : (s.team_name || 'Team')} • {s.track}
                </div>
              </div>
            ))}
          </div>

          {/* Rubric Evaluation Form */}
          {selectedSub && (
            <form onSubmit={handleScoreSubmit} className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  {selectedSub.track}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedSub.project_title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedSub.tagline}
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                  <a href={selectedSub.github_repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ExternalLink size={13} /> GitHub Repo
                  </a>
                  {selectedSub.live_demo_url && (
                    <a href={selectedSub.live_demo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={13} /> Live Demo
                    </a>
                  )}
                </div>
              </div>

              {/* 4 Criteria Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(rubric?.criteria || [
                  { id: 'innovation', name: 'Innovation & Originality', weight: 0.30, maxScore: 10 },
                  { id: 'technical_depth', name: 'Technical Depth & Execution', weight: 0.30, maxScore: 10 },
                  { id: 'feasibility', name: 'Real-World Feasibility', weight: 0.25, maxScore: 10 },
                  { id: 'ui_ux', name: 'UI/UX Polish', weight: 0.15, maxScore: 10 }
                ]).map((crit) => (
                  <div key={crit.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '13px' }}>{crit.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          (Weight: {Math.round(crit.weight * 100)}%)
                        </span>
                      </div>
                      <span className="machine-data" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {scores[crit.id] || 8.0} / 10
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={scores[crit.id] || 8.0}
                      onChange={(e) => setScores({ ...scores, [crit.id]: parseFloat(e.target.value) })}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                    />
                  </div>
                ))}
              </div>

              {/* Weighted Score Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Raw Weighted Total Score:</span>
                <span className="machine-data" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {calculateWeightedTotal()} / 10.0
                </span>
              </div>

              {/* Private Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Private Deliberation Notes (Hidden from participants)
                </label>
                <textarea
                  rows={3}
                  placeholder="Strengths, architectural concerns, or questions for final stage pitches..."
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="submit" disabled={submitting} className="btn-primary">
                  <CheckCircle2 size={16} /> Submit Evaluation
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
