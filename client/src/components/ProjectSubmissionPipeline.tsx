// Project Submission Pipeline, Live Cutoff Countdown & Cryptographic Receipts
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  GitBranch, Play, ExternalLink, ShieldCheck, 
  Clock, Lock, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import type { Submission } from '../types';

interface ProjectSubmissionPipelineProps {
  currentTeamId?: string;
  onSubmissionSuccess?: (sub: Submission) => void;
}

export const ProjectSubmissionPipeline: React.FC<ProjectSubmissionPipelineProps> = ({
  currentTeamId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  onSubmissionSuccess
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPast: boolean }>({
    hours: 6,
    minutes: 0,
    seconds: 0,
    isPast: false
  });

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [track, setTrack] = useState<string>('AI/ML & Automation');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [demoUrl, setDemoUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [slidesUrl, setSlidesUrl] = useState<string>('');
  const [diagramUrl, setDiagramUrl] = useState<string>('');
  const [license, setLicense] = useState<string>('Apache-2.0');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  // Fetch deadline and existing submission
  const fetchSubmission = async () => {
    try {
      const [deadRes, subRes] = await Promise.all([
        fetch('/api/submissions/deadline'),
        fetch(`/api/submissions/team/${currentTeamId}`)
      ]);

      const deadData = await deadRes.json();
      if (deadData.success && deadData.deadlineMs) {
        const diff = deadData.deadlineMs - Date.now();
        if (diff > 0) {
          const totalSecs = Math.floor(diff / 1000);
          setTimeLeft({
            hours: Math.floor(totalSecs / 3600),
            minutes: Math.floor((totalSecs % 3600) / 60),
            seconds: totalSecs % 60,
            isPast: false
          });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPast: true });
        }
      }

      const subData = await subRes.json();
      if (subData.success && subData.submission) {
        const s = subData.submission;
        setSubmission(s);
        setTitle(s.project_title);
        setTagline(s.tagline || '');
        setDescription(s.description || '');
        setTrack(s.track);
        setGithubUrl(s.github_repo_url);
        setDemoUrl(s.live_demo_url || '');
        setVideoUrl(s.video_url || '');
        setSlidesUrl(s.slides_url || '');
        setDiagramUrl(s.diagram_url || '');
        setLicense(s.license_type || 'Apache-2.0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [currentTeamId]);

  // Synchronized countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.isPast) return prev;
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { ...prev, isPast: true };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSave = async (isDraft: boolean) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: currentTeamId,
          projectTitle: title,
          tagline,
          description,
          track,
          githubRepoUrl: githubUrl,
          liveDemoUrl: demoUrl,
          videoUrl,
          slidesUrl,
          diagramUrl,
          licenseType: license,
          isDraft
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmission(data.submission);
        setStatusMsg({ text: data.message, type: 'ok' });
        if (!isDraft) {
          triggerCelebrationConfetti();
        }
        onSubmissionSuccess?.(data.submission);
      } else {
        setStatusMsg({ text: data.error, type: 'err' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div className="card-base" style={{ padding: '24px' }}>
          <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '16px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '60px', marginBottom: '12px' }} />
          <div className="skeleton-line" style={{ width: '70%', height: '20px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Synchronized Deadline Countdown Hero Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: timeLeft.isPast ? 'var(--status-danger-bg)' : 'var(--brand-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: timeLeft.isPast ? '#EF4444' : 'var(--brand-primary)'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Official Submission Deadline
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
              {timeLeft.isPast ? '⚠️ CODE FREEZE CUTOFF REACHED' : 'Synchronized Countdown to Code Freeze'}
            </h3>
          </div>
        </div>

        {/* Digits Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            minWidth: '58px'
          }}>
            <div className="machine-data" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>HRS</div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            minWidth: '58px'
          }}>
            <div className="machine-data" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MIN</div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            minWidth: '58px'
          }}>
            <div className="machine-data" style={{ fontSize: '22px', fontWeight: 800, color: timeLeft.isPast ? '#EF4444' : 'var(--brand-primary)' }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>SEC</div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: statusMsg.type === 'ok' ? 'var(--status-ok-bg)' : 'var(--status-danger-bg)',
          color: statusMsg.type === 'ok' ? 'var(--status-ok-text)' : 'var(--status-danger-text)',
          border: `1px solid ${statusMsg.type === 'ok' ? 'var(--status-ok-border)' : 'var(--status-danger-border)'}`,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {statusMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Submission Form & Cryptographic Proof */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Input Form */}
        <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Project Submission Roster</h3>
            {submission && !submission.is_draft && (
              <span className="status-badge verified">
                <CheckCircle2 size={12} /> Locked & Submitted
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AuraMesh Neural DB"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Track *
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option value="AI/ML & Automation">AI/ML & Automation</option>
                <option value="FinTech & Web3">FinTech & Web3</option>
                <option value="Open Innovation">Open Innovation</option>
                <option value="HealthTech & Bio">HealthTech & Bio</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              One-Line Tagline *
            </label>
            <input
              type="text"
              placeholder="e.g. Sub-millisecond localized vector clustering on decentralized edge nodes."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Comprehensive Project Description & Architecture *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail your problem statement, system architecture, tech stack, and accomplishments..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          {/* Repository & Live Demo URLs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Public GitHub / GitLab Repository *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/org/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <GitBranch size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Live Deployment URL (Vercel, Supabase, Cloud)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  placeholder="https://your-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <ExternalLink size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
            </div>
          </div>

          {/* Media Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Demo Video (YouTube or Loom Embed)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or Loom"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Play size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Pitch Deck (PDF Slides URL)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  placeholder="https://speakerdeck.com/... or Google Slides"
                  value={slidesUrl}
                  onChange={(e) => setSlidesUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <FileText size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              </div>
            </div>
          </div>

          {/* Action Buttons: Save Draft vs Lock Final Submission */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="btn-secondary"
            >
              {saving ? 'Saving Draft...' : 'Save Draft (Keep Editing)'}
            </button>

            <button
              type="button"
              disabled={saving || timeLeft.isPast}
              onClick={() => handleSave(false)}
              className="btn-primary"
            >
              <Lock size={15} /> Lock & Submit for Judging
            </button>
          </div>
        </div>

        {/* Right: Cryptographic Proof & Live Video Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cryptographic Receipt Card */}
          <div className="card-base" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="var(--status-ok)" />
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Cryptographic Proof</h4>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
              Submissions receive a SHA-256 HMAC cryptographic signature guaranteeing commit timestamp and code immutability.
            </p>

            {submission?.cryptographic_receipt ? (
              <div style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tamper-Evident SHA-256 Receipt:
                </span>
                <div className="machine-data" style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  wordBreak: 'break-all',
                  marginTop: '4px'
                }}>
                  {submission.cryptographic_receipt}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Timestamp: {submission.submitted_at || 'Just now'}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface-subtle)',
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--text-dim)'
              }}>
                Receipt generated upon locking final submission.
              </div>
            )}
          </div>

          {/* Live Video Embed Preview */}
          {videoUrl && (
            <div className="card-base" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={14} color="var(--brand-primary)" /> Video Embed Preview
              </h4>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#000'
              }}>
                <iframe
                  src={videoUrl.replace('watch?v=', 'embed/')}
                  title="Demo Video Preview"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
