// Live Operations Timeline, Real-time Shifts, Sponsor Bounties & Stage Presentation Queue
import React, { useState, useEffect } from 'react';
import { 
  Calendar, FastForward, Megaphone, 
  Tv, Award, QrCode, Radio
} from 'lucide-react';
import type { ScheduleItem, AnnouncementItem, SponsorBooth, PresentationQueueItem } from '../types';

export const LiveOperationsConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'announcements' | 'sponsors' | 'stage-queue' | 'gate-scanner'>('schedule');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [sponsors, setSponsors] = useState<SponsorBooth[]>([]);
  const [queue, setQueue] = useState<PresentationQueueItem[]>([]);
  const [gateStats, setGateStats] = useState<any>(null);

  // Shift Schedule modal state
  const [shiftMinutes, setShiftMinutes] = useState<number>(30);
  const [shiftReason, setShiftReason] = useState<string>('Extended lunch & sponsor networking');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);

  // Announcement state
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annMsg, setAnnMsg] = useState<string>('');
  const [annUrgency, setAnnUrgency] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [isAnnModalOpen, setIsAnnModalOpen] = useState<boolean>(false);

  // Gate Scanner state
  const [scanTicketId, setScanTicketId] = useState<string>('TCK-2026-003');
  const [scanResult, setScanResult] = useState<any>(null);

  const fetchLiveOpsData = async () => {
    try {
      const [schedRes, annRes, sponsRes, queueRes, statsRes] = await Promise.all([
        fetch('/api/live/schedule'),
        fetch('/api/live/announcements'),
        fetch('/api/live/sponsor-booths'),
        fetch('/api/live/presentation-queue'),
        fetch('/api/gate/stats')
      ]);

      const sData = await schedRes.json();
      const aData = await annRes.json();
      const spData = await sponsRes.json();
      const qData = await queueRes.json();
      const stData = await statsRes.json();

      if (sData.success) setSchedule(sData.schedule);
      if (aData.success) setAnnouncements(aData.announcements);
      if (spData.success) setSponsors(spData.booths);
      if (qData.success) setQueue(qData.queue);
      if (stData.success) setGateStats(stData.stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLiveOpsData();
  }, []);

  const handleShiftSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/live/schedule/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: shiftMinutes, reason: shiftReason })
      });
      const data = await res.json();
      if (data.success) {
        setIsShiftModalOpen(false);
        fetchLiveOpsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMsg.trim()) return;

    try {
      const res = await fetch('/api/live/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: annTitle, message: annMsg, urgency: annUrgency })
      });
      const data = await res.json();
      if (data.success) {
        setIsAnnModalOpen(false);
        setAnnTitle('');
        setAnnMsg('');
        fetchLiveOpsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: scanTicketId })
      });
      const data = await res.json();
      setScanResult(data);
      fetchLiveOpsData();
    } catch (err: any) {
      setScanResult({ success: false, error: err.message });
    }
  };

  const handleQueueStatusChange = async (slot: number, status: string) => {
    try {
      await fetch(`/api/live/presentation-queue/${slot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchLiveOpsData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Subtab Navigation Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'schedule', label: 'Timeline & Shifts', icon: Calendar },
            { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
            { id: 'sponsors', label: 'Sponsor Bounties', icon: Award },
            { id: 'stage-queue', label: 'Stage Demos Queue', icon: Tv },
            { id: 'gate-scanner', label: 'Venue Desk Scanner', icon: QrCode }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isSel ? 'var(--brand-primary)' : 'transparent',
                  color: isSel ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <FastForward size={14} /> Shift Timeline
          </button>
          <button
            onClick={() => setIsAnnModalOpen(true)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Megaphone size={14} /> Broadcast Alert
          </button>
        </div>
      </div>

      {/* 1. SCHEDULE TIMELINE & SHIFT OPERATIONS */}
      {activeSubTab === 'schedule' && (
        <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Master Event Schedule Timeline</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Live Auto-Sync Enabled • Dynamic Cascade
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {schedule.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: item.is_active_now ? 'var(--brand-glow)' : 'var(--bg-surface-subtle)',
                  border: item.is_active_now ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="machine-data" style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: item.is_active_now ? 'var(--brand-primary)' : 'var(--text-muted)',
                    minWidth: '85px'
                  }}>
                    {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.title}
                      </h4>
                      {item.is_active_now && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Radio size={10} /> HAPPENING NOW
                        </span>
                      )}
                      {item.delay_minutes > 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'var(--status-warn-bg)',
                          color: 'var(--status-warn-text)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)'
                        }}>
                          +{item.delay_minutes}M SHIFTED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.description} • <strong>{item.location}</strong>
                    </p>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)'
                }}>
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ANNOUNCEMENTS FEED */}
      {activeSubTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="card-base"
              style={{
                borderLeft: `4px solid ${
                  ann.urgency === 'CRITICAL' ? '#EF4444' :
                  ann.urgency === 'WARNING' ? '#F59E0B' : 'var(--brand-primary)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: ann.urgency === 'CRITICAL' ? 'var(--status-danger-bg)' : ann.urgency === 'WARNING' ? 'var(--status-warn-bg)' : 'var(--brand-glow)',
                  color: ann.urgency === 'CRITICAL' ? 'var(--status-danger-text)' : ann.urgency === 'WARNING' ? 'var(--status-warn-text)' : 'var(--brand-primary)'
                }}>
                  {ann.urgency} ALERT
                </span>
                <span className="machine-data" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{ann.title}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ann.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 3. SPONSOR BOOTHS & PRIZE BOUNTIES */}
      {activeSubTab === 'sponsors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {sponsors.map((sp) => (
            <div key={sp.id} className="card-base" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--brand-glow)',
                    color: 'var(--brand-primary)'
                  }}>
                    {sp.tier} SPONSOR
                  </span>
                  <span className="machine-data" style={{ fontSize: '15px', fontWeight: 800, color: '#10B981' }}>
                    {sp.bounty_amount}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>{sp.name}</h3>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>
                  {sp.challenge_title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '4px' }}>
                  {sp.challenge_description}
                </p>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Booth Location: <strong>{sp.booth_location}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(sp.tech_tags || []).map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {sp.website_url && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <a
                    href={sp.website_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    View API Docs & Guidelines →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. STAGE PRESENTATION QUEUE */}
      {activeSubTab === 'stage-queue' && (
        <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Main Stage Finalist Demo Queue</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              10-Minute Presentation Slots
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {queue.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: q.status === 'PRESENTING' ? 'var(--brand-glow)' : 'var(--bg-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}>
                    #{q.slot_number}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{q.team_name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Room: <strong>{q.room}</strong>
                    </p>
                  </div>
                </div>

                {/* Status Switcher for Stage Manager */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {['WAITING', 'ON_DECK', 'PRESENTING', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleQueueStatusChange(q.slot_number, st)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        border: q.status === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                        backgroundColor: q.status === st ? 'var(--brand-primary)' : 'var(--bg-surface)',
                        color: q.status === st ? '#FFFFFF' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. VENUE GATE CHECK-IN SCANNER */}
      {activeSubTab === 'gate-scanner' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <form onSubmit={handleGateScan} className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} color="var(--brand-primary)" />
              Venue Gate Desk QR Scanner
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Scan attendee ticket passes to verify identity, validate legal waiver signature, and record physical entry.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Ticket ID or Digital QR Hash
              </label>
              <input
                type="text"
                required
                className="machine-data"
                value={scanTicketId}
                onChange={(e) => setScanTicketId(e.target.value)}
                placeholder="TCK-2026-003 or User ID"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px' }}>
              Simulate Gate Desk Scan
            </button>

            {scanResult && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: scanResult.success ? 'var(--status-ok-bg)' : 'var(--status-danger-bg)',
                color: scanResult.success ? 'var(--status-ok-text)' : 'var(--status-danger-text)',
                border: `1px solid ${scanResult.success ? 'var(--status-ok-border)' : 'var(--status-danger-border)'}`,
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  {scanResult.success ? '✅ ' + scanResult.message : '❌ ' + scanResult.error}
                </div>
                {scanResult.badgeInfo && (
                  <div style={{ fontSize: '11px', marginTop: '6px', lineHeight: '1.5' }}>
                    Attendee: <strong>{scanResult.badgeInfo.name}</strong> ({scanResult.badgeInfo.affiliation})<br />
                    Role: {scanResult.badgeInfo.role} • Dietary: {scanResult.badgeInfo.dietary}
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Gate Attendance Summary Stats */}
          <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Physical Venue Attendance</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Confirmed</span>
                <div className="machine-data" style={{ fontSize: '24px', fontWeight: 800 }}>
                  {gateStats?.totalRegisteredParticipants || 4}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--status-ok-bg)', border: '1px solid var(--status-ok-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--status-ok-text)', fontWeight: 600 }}>Checked In at Venue</span>
                <div className="machine-data" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-ok-text)' }}>
                  {gateStats?.checkedInCount || 3}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              • Attendance rate: <strong>{gateStats?.attendancePercentage || 75}%</strong><br />
              • Signed Waivers: <strong>{gateStats?.waiverSignedCount || 4}</strong> of {gateStats?.totalRegisteredParticipants || 4}<br />
              • Physical Badges Printed: <strong>{gateStats?.checkedInCount || 3}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shift Schedule */}
      {isShiftModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form onSubmit={handleShiftSchedule} className="card-base" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Shift Event Timeline</h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Shift Duration (Minutes)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[15, 30, 45, 60].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setShiftMinutes(m)}
                    className="btn-secondary"
                    style={{ flex: 1, backgroundColor: shiftMinutes === m ? 'var(--brand-glow)' : 'var(--bg-surface-subtle)', borderColor: shiftMinutes === m ? 'var(--brand-primary)' : 'var(--border-color)', fontWeight: 700 }}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={shiftMinutes}
                onChange={(e) => setShiftMinutes(parseInt(e.target.value, 10))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Reason & Context (Broadcasted to Attendees)
              </label>
              <input
                type="text"
                required
                value={shiftReason}
                onChange={(e) => setShiftReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setIsShiftModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Apply Timeline Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Broadcast Announcement */}
      {isAnnModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form onSubmit={handleBroadcastAnnouncement} className="card-base" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Broadcast Live Announcement</h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 🍕 Midnight Pizza Delivered to Ground Floor"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Urgency Tier
              </label>
              <select
                value={annUrgency}
                onChange={(e) => setAnnUrgency(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="INFO">Info (General Update)</option>
                <option value="WARNING">Warning (Milestone / Deadline)</option>
                <option value="CRITICAL">Critical (Urgent Attention)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Message Content *
              </label>
              <textarea
                rows={3}
                required
                value={annMsg}
                onChange={(e) => setAnnMsg(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setIsAnnModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Broadcast Live
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
