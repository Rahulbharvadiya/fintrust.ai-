import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertOctagon, UserX, Clock, Eye, Sparkles, ArrowRight } from 'lucide-react';
import type { TestVector } from '../types';

interface TestCasesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  testVectors: TestVector[];
  onSelectTestVector: (vector: TestVector) => void;
}

export const TestCasesDrawer: React.FC<TestCasesDrawerProps> = ({
  isOpen,
  onClose,
  testVectors,
  onSelectTestVector
}) => {
  if (!isOpen) return null;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'GENUINE_APPROVED':
      case 'GENUINE_COLLEGE_APPROVED':
        return { label: 'GENUINE ID', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle };
      case 'TAMPER_FORGERY':
        return { label: 'FORGERY / ELA', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', icon: AlertOctagon };
      case 'SYBIL_FRAUD':
        return { label: 'SYBIL ATTACK', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', icon: AlertTriangle };
      case 'FACE_MISMATCH':
        return { label: 'BIOMETRIC MISMATCH', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', icon: UserX };
      case 'INELIGIBLE_STUDENT':
        return { label: 'EXPIRED STUDENT', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: Clock };
      case 'REVIEW_QUEUE_MINIMAL_FALSE_POSITIVE':
        return { label: 'ZERO FALSE POSITIVE', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: Eye };
      default:
        return { label: 'QUALITY RETRY', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0', icon: Sparkles };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-dropdown)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand-glow)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} color="var(--brand-primary)" />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Preloaded Identity Test Vectors
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select any scenario to evaluate genuine verification, tampering forensics, Sybil duplicate prevention, and review routing.
            </p>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }} id="close-test-drawer">
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* List of Vectors */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '14px', backgroundColor: 'var(--bg-page)' }}>
          {testVectors.map((v) => {
            const badge = getCategoryBadge(v.category);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={v.id}
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  onSelectTestVector(v);
                  onClose();
                }}
                id={`card-test-${v.id.toLowerCase()}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>

                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {v.id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {v.label}
                  </h3>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {v.description}
                  </p>
                </div>

                <div style={{
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Expected: </span>
                    <span style={{ fontWeight: 600, color: badge.color, fontFamily: 'var(--font-mono)' }}>{v.expectedOutcome}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 600 }}>
                    <span>Test Vector</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
