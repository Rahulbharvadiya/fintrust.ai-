// Mentor Helpdesk Queue & Technical Guidance Dispatch Component
import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Clock, MapPin, CheckCircle2, User, 
  Plus, Send, Radio
} from 'lucide-react';
import type { MentorTicket, MentorProfile } from '../types';

interface MentorHelpdeskQueueProps {
  currentTeamId?: string;
  isMentorView?: boolean;
}

export const MentorHelpdeskQueue: React.FC<MentorHelpdeskQueueProps> = ({
  currentTeamId
}) => {
  const [tickets, setTickets] = useState<MentorTicket[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);

  // New Ticket Form State
  const [ticketTitle, setTicketTitle] = useState<string>('');
  const [ticketDomain, setTicketDomain] = useState<string>('AI_ML');
  const [ticketUrgency, setTicketUrgency] = useState<string>('HIGH');
  const [ticketDescription, setTicketDescription] = useState<string>('');
  const [roomLocation, setRoomLocation] = useState<string>('Arena Table 14');
  const [tableNumber, setTableNumber] = useState<string>('14');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTickets = async () => {
    try {
      const [ticketsRes, mentorsRes, metricsRes] = await Promise.all([
        fetch(`/api/helpdesk/tickets?domain=${domainFilter}`),
        fetch('/api/helpdesk/mentors'),
        fetch('/api/helpdesk/metrics')
      ]);

      const tData = await ticketsRes.json();
      const mData = await mentorsRes.json();
      const metData = await metricsRes.json();

      if (tData.success) setTickets(tData.tickets);
      if (mData.success) setMentors(mData.mentors);
      if (metData.success) setMetrics(metData.metrics);
    } catch (err) {
      console.error('Helpdesk fetch error:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [domainFilter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: currentTeamId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          title: ticketTitle,
          domain: ticketDomain,
          urgency: ticketUrgency,
          description: ticketDescription,
          roomLocation,
          tableNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitOpen(false);
        setTicketTitle('');
        setTicketDescription('');
        fetchTickets();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (ticketId: string) => {
    try {
      await fetch(`/api/helpdesk/tickets/${ticketId}/claim`, { method: 'PUT' });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (ticketId: string) => {
    const notes = prompt('Resolution summary / advice given to team:');
    if (!notes) return;
    try {
      await fetch(`/api/helpdesk/tickets/${ticketId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Banner & Queue Live Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div className="card-base" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--brand-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-primary)'
          }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Tickets
            </span>
            <div className="machine-data" style={{ fontSize: '20px', fontWeight: 800 }}>
              {metrics ? metrics.openTickets : tickets.filter(t => t.status === 'OPEN').length} Open
            </div>
          </div>
        </div>

        <div className="card-base" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-ok-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-ok)'
          }}>
            <User size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Mentors on Floor
            </span>
            <div className="machine-data" style={{ fontSize: '20px', fontWeight: 800 }}>
              {mentors.filter(m => m.is_available).length} Available
            </div>
          </div>
        </div>

        <div className="card-base" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-warn-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-warn)'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Estimated Response
            </span>
            <div className="machine-data" style={{ fontSize: '20px', fontWeight: 800 }}>
              ~{metrics?.estimatedWaitMinutes || 8} Minutes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="btn-primary"
            style={{ width: '100%', height: '100%', padding: '14px', fontSize: '13px' }}
          >
            <Plus size={16} /> Request Mentor Guidance
          </button>
        </div>
      </div>

      {/* Main Helpdesk Body: Left = Queue, Right = Active Mentors Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left Column: Tickets Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Domain Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {['ALL', 'AI_ML', 'FRONTEND', 'BACKEND', 'CLOUD_DEVOPS', 'UI_UX_DESIGN', 'PITCH_PRESENTATION'].map((dom) => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: domainFilter === dom ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  backgroundColor: domainFilter === dom ? 'var(--brand-glow)' : 'var(--bg-surface)',
                  color: domainFilter === dom ? 'var(--brand-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {dom.replace('_', '/')}
              </button>
            ))}
          </div>

          {/* Tickets List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.map((t) => {
              const isOpen = t.status === 'OPEN';
              const isClaimed = t.status === 'CLAIMED';

              return (
                <div
                  key={t.id}
                  className="card-base"
                  style={{
                    padding: '16px',
                    borderLeft: `4px solid ${
                      t.urgency === 'CRITICAL' ? '#EF4444' :
                      t.urgency === 'HIGH' ? '#F59E0B' : '#10B981'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {t.domain}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: t.urgency === 'CRITICAL' ? 'var(--status-danger-bg)' : 'var(--status-warn-bg)',
                          color: t.urgency === 'CRITICAL' ? 'var(--status-danger-text)' : 'var(--status-warn-text)'
                        }}>
                          {t.urgency} URGENCY
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: isOpen ? 'var(--status-ok-bg)' : isClaimed ? 'var(--status-warn-bg)' : 'var(--bg-surface-subtle)',
                          color: isOpen ? 'var(--status-ok-text)' : isClaimed ? 'var(--status-warn-text)' : 'var(--text-muted)'
                        }}>
                          {t.status}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                        {t.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} /> Location: <strong>{t.room_location} (Table {t.table_number})</strong>
                        </span>
                        <span>Team: <strong>{t.team_name}</strong></span>
                        {t.mentor_name && <span>Assigned Mentor: <strong style={{ color: 'var(--brand-primary)' }}>{t.mentor_name}</strong></span>}
                      </div>

                      {t.resolution_notes && (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--status-ok-bg)',
                          border: '1px solid var(--status-ok-border)',
                          fontSize: '12px',
                          color: 'var(--status-ok-text)'
                        }}>
                          <strong>Mentor Advice:</strong> {t.resolution_notes}
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Claim / Resolve) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {isOpen && (
                        <button onClick={() => handleClaim(t.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Claim Ticket
                        </button>
                      )}
                      {isClaimed && (
                        <button onClick={() => handleResolve(t.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: '#10B981' }}>
                          <CheckCircle2 size={13} /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Mentors on Duty */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#10B981" /> Active Mentors Directory
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mentors.map((m) => (
              <div key={m.user_id} className="card-base" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <img
                    src={m.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                    alt={m.full_name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700 }}>{m.full_name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.affiliation}</p>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    <MapPin size={12} color="var(--brand-primary)" />
                    <span>{m.current_location}</span>
                  </div>
                  <div className="machine-data" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    Handle: {m.contact_handle} • Solved: {m.total_tickets_resolved}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(m.domains || []).map((d, i) => (
                    <span key={i} style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Submit Ticket */}
      {isSubmitOpen && (
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
          <form onSubmit={handleCreateTicket} className="card-base" style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Dispatch Mentor Helpdesk Ticket</h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Issue Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Memory leak in WebAssembly thread pool"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Technical Domain *
                </label>
                <select
                  value={ticketDomain}
                  onChange={(e) => setTicketDomain(e.target.value)}
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
                  <option value="AI_ML">AI / ML / Agents</option>
                  <option value="FRONTEND">Frontend / React / UI</option>
                  <option value="BACKEND">Backend / APIs / DB</option>
                  <option value="CLOUD_DEVOPS">Cloud / Docker / Edge</option>
                  <option value="UI_UX_DESIGN">UI / UX Design</option>
                  <option value="PITCH_PRESENTATION">Pitch & Presentation</option>
                  <option value="GENERAL_BLOCKER">General Blocker</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Urgency Level *
                </label>
                <select
                  value={ticketUrgency}
                  onChange={(e) => setTicketUrgency(e.target.value)}
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
                  <option value="LOW">Low (Exploratory / Advice)</option>
                  <option value="MEDIUM">Medium (Architecture Blocker)</option>
                  <option value="HIGH">High (Code Freeze Threatened)</option>
                  <option value="CRITICAL">Critical (Crash / System Down)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Physical Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Hall, Table 14"
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
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
                  Table #
                </label>
                <input
                  type="text"
                  placeholder="14"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
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
                Detailed Description & Error Log *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe what you tried, the error message, and repository links..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" onClick={() => setIsSubmitOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                <Send size={15} /> {submitting ? 'Dispatching...' : 'Dispatch Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
