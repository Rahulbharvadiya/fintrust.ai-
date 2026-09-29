// Team Formation, Collaboration & Matchmaking Directory Hub
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Copy, Check, Plus, AlertCircle
} from 'lucide-react';
import type { Team, UserProfile } from '../types';

interface TeamCollaborationHubProps {
  currentUser?: UserProfile | null;
  onTeamUpdated?: () => void;
}

export const TeamCollaborationHub: React.FC<TeamCollaborationHubProps> = ({
  currentUser,
  onTeamUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matchmaking' | 'my-team' | 'create'>('matchmaking');
  const [teams, setTeams] = useState<Team[]>([]);
  const [soloHackers, setSoloHackers] = useState<UserProfile[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  // Create team form
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamTrack, setNewTeamTrack] = useState<string>('AI/ML & Automation');
  const [newTeamCap, setNewTeamCap] = useState<number>(4);
  const [newTeamSkills, setNewTeamSkills] = useState<string>('UI/UX, PyTorch');
  const [newTeamPitch, setNewTeamPitch] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [slackWebhook, setSlackWebhook] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, hackersRes] = await Promise.all([
        fetch(`/api/teams/directory?missingSkill=${encodeURIComponent(skillFilter)}`),
        fetch(`/api/profiles/directory?lookingForTeam=true&skill=${encodeURIComponent(skillFilter)}`)
      ]);

      const teamsData = await teamsRes.json();
      const hackersData = await hackersRes.json();

      if (teamsData.success) setTeams(teamsData.teams);
      if (hackersData.success) setSoloHackers(hackersData.profiles);

      // Check current user team
      if (currentUser?.id) {
        const myTeamRes = await fetch(`/api/profiles/${currentUser.id}`);
        const myTeamData = await myTeamRes.json();
        if (myTeamData.success && myTeamData.team) {
          setMyTeam(myTeamData.team);
        }
      } else {
        // Fallback default sample team
        const defaultTeam = teamsData.teams?.[0] || null;
        setMyTeam(defaultTeam);
      }
    } catch (err) {
      console.error('Fetch teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [skillFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: joinCodeInput.trim(),
          roleInTeam: 'FULLSTACK'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'ok' });
        setJoinCodeInput('');
        fetchData();
        onTeamUpdated?.();
      } else {
        setStatusMessage({ text: data.error, type: 'err' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName.trim(),
          track: newTeamTrack,
          maxMembers: newTeamCap,
          lookingForSkills: newTeamSkills.split(',').map(s => s.trim()).filter(Boolean),
          pitchSummary: newTeamPitch.trim(),
          discordWebhookUrl: discordWebhook || null,
          slackWebhookUrl: slackWebhook || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: `Team ${data.team.name} created! Invite code: ${data.team.invite_code}`, type: 'ok' });
        setActiveSubTab('my-team');
        setMyTeam(data.team);
        fetchData();
        onTeamUpdated?.();
      } else {
        setStatusMessage({ text: data.error, type: 'err' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div className="card-base" style={{ padding: '24px' }}>
          <div className="skeleton-line" style={{ width: '30%', height: '24px', marginBottom: '16px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '40px', marginBottom: '12px' }} />
          <div className="skeleton-line" style={{ width: '60%', height: '20px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Sub-Nav Pill Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '6px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveSubTab('matchmaking')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeSubTab === 'matchmaking' ? 'var(--brand-primary)' : 'transparent',
              color: activeSubTab === 'matchmaking' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Search size={15} />
            <span>Looking for Team ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('my-team')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeSubTab === 'my-team' ? 'var(--brand-primary)' : 'transparent',
              color: activeSubTab === 'my-team' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Users size={15} />
            <span>My Team Hub</span>
          </button>

          <button
            onClick={() => setActiveSubTab('create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeSubTab === 'create' ? 'var(--brand-primary)' : 'transparent',
              color: activeSubTab === 'create' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>Form New Team</span>
          </button>
        </div>

        {/* Secret Code Quick Join Bar */}
        <form onSubmit={handleJoinWithCode} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Invite Code (e.g. HACK-7X9Q)"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            className="machine-data"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              width: '180px'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            Join
          </button>
        </form>
      </div>

      {statusMessage && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: statusMessage.type === 'ok' ? 'var(--status-ok-bg)' : 'var(--status-danger-bg)',
          color: statusMessage.type === 'ok' ? 'var(--status-ok-text)' : 'var(--status-danger-text)',
          border: `1px solid ${statusMessage.type === 'ok' ? 'var(--status-ok-border)' : 'var(--status-danger-border)'}`,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. MATCHMAKING & LOOKING FOR TEAM SHOWCASE */}
      {activeSubTab === 'matchmaking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search teams by missing skill (e.g. UI/UX, PyTorch, Go, Three.js)..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            {skillFilter && (
              <button
                onClick={() => setSkillFilter('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Grid of Teams with Open Spots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {teams.map((t) => (
              <div key={t.id} className="card-base" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--brand-primary)',
                      backgroundColor: 'var(--brand-glow)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)'
                    }}>
                      {t.track}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {t.current_members_count} / {t.max_members} Members
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{t.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {t.pitch_summary || 'Building next-generation decentralized edge applications.'}
                  </p>

                  {/* Looking for skills */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Looking for Skills:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {(t.looking_for_skills || []).map((sk, idx) => (
                        <span key={idx} style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="machine-data" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Code: <strong style={{ color: 'var(--text-primary)' }}>{t.invite_code}</strong>
                    </span>
                    <button
                      onClick={() => handleCopyCode(t.invite_code)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                      title="Copy invite code"
                    >
                      {copiedCode ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setJoinCodeInput(t.invite_code);
                      handleJoinWithCode({ preventDefault: () => {} } as any);
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Join Team
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Solo Hackers Looking for Teammates */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} color="var(--brand-primary)" />
              Solo Hackers Available for Matchmaking ({soloHackers.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {soloHackers.map((hacker) => (
                <div key={hacker.id} className="card-base" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={hacker.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={hacker.full_name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hacker.full_name}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hacker.affiliation || 'Student'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {(hacker.skills || []).slice(0, 3).map((sk, idx) => (
                        <span key={idx} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MY TEAM HUB */}
      {activeSubTab === 'my-team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myTeam ? (
            <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    {myTeam.track}
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>{myTeam.name}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {myTeam.pitch_summary || 'Autonomous agentic system built for Hackathon 2026.'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Secret Invite Code
                    </span>
                    <div className="machine-data" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {myTeam.invite_code}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(myTeam.invite_code)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    {copiedCode ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  Team Members ({myTeam.current_members_count} / {myTeam.max_members})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {(myTeam.members || []).map((m, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <img
                        src={m.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.name}`}
                        alt={m.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Role: {m.role_in_team}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-base" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>You are not in a team yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', margin: '6px auto 16px auto' }}>
                Join an existing team using their secret 6-character invite code, or form a brand new team below.
              </p>
              <button onClick={() => setActiveSubTab('create')} className="btn-primary">
                Form a New Team
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. FORM NEW TEAM */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleCreateTeam} className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Register New Hackathon Team</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Team Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NeuralMesh Agents"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
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
                Track Selection *
              </label>
              <select
                value={newTeamTrack}
                onChange={(e) => setNewTeamTrack(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Max Members (Cap)
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={newTeamCap}
                onChange={(e) => setNewTeamCap(parseInt(e.target.value, 10))}
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
                Looking for Skills (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. UI/UX, PyTorch, Go, Three.js"
                value={newTeamSkills}
                onChange={(e) => setNewTeamSkills(e.target.value)}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Pitch & Project Summary
            </label>
            <textarea
              rows={3}
              placeholder="What are you building? Give a 2-sentence overview to attract top teammates..."
              value={newTeamPitch}
              onChange={(e) => setNewTeamPitch(e.target.value)}
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

          {/* Webhooks Provisioning */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Discord Webhook URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Slack Webhook URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={() => setActiveSubTab('matchmaking')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} /> Create Team & Generate Code
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
