import React, { useState } from 'react';
import { Printer, CheckCircle, MapPin, Award } from 'lucide-react';

interface ParticipantTicketProps {
  ticket: any;
  registrationId: string;
}

export const ParticipantTicket: React.FC<ParticipantTicketProps> = ({ ticket, registrationId }) => {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(ticket?.checkInStatus === 'CHECKED_IN_AT_DESK');
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

  if (!ticket) return null;

  const handleVenueCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await fetch(`/api/check-in/${registrationId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsCheckedIn(true);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Official Digital Participant Credential Pass
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <Printer size={13} /> Print Pass
          </button>
        </div>
      </div>

      {/* Ticket Container */}
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Top Header Banner */}
        <div style={{
          backgroundColor: 'var(--brand-primary)',
          padding: '24px 28px',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.85)' }}>
                INSTITUTIONAL CREDENTIAL PASS
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {ticket.eventName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '4px' }}>
                <MapPin size={13} />
                <span>{ticket.venueDesk}</span>
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '6px 14px',
              borderRadius: '6px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF'
            }}>
              <span style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>TRUST SCORE</span>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>{ticket.trustScore}%</span>
            </div>
          </div>
        </div>

        {/* Ticket Details & QR Grid */}
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                ATTENDEE NAME
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ticket.attendeeName}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  INSTITUTION
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {ticket.college}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  VERIFIED PROOF
                </span>
                <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {ticket.docTypeVerified}
                </p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                CRYPTOGRAPHIC SIGNATURE
              </span>
              <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all', backgroundColor: 'var(--bg-surface-subtle)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                {ticket.cryptoSignature}
              </p>
            </div>

            {/* Check-In Status Action */}
            <div style={{ marginTop: '6px' }}>
              {isCheckedIn ? (
                <span className="badge-success" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  <CheckCircle size={14} />
                  CHECKED-IN AT VENUE DESK
                </span>
              ) : (
                <button
                  onClick={handleVenueCheckIn}
                  disabled={isCheckingIn}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '7px 16px' }}
                >
                  <CheckCircle size={14} />
                  <span>{isCheckingIn ? 'Marking Check-In...' : 'Desk Check-In Pass'}</span>
                </button>
              )}
            </div>

          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <img
              src={ticket.qrCode}
              alt="Verification QR Code"
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '4px'
              }}
            />
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}>
              PASS: {ticket.ticketId}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
