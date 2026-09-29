import React, { useState, useEffect } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import type { EventConfig } from '../types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, onRulesUpdated }) => {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/event-config')
        .then(r => r.json())
        .then(d => {
          if (d.success) setConfig(d.config);
        });
    }
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/event-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      onRulesUpdated();
      onClose();
    } catch (err) {
      console.error('Save rules error:', err);
    } finally {
      setIsSaving(false);
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
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-dropdown)',
        overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Eligibility & Verification Policy
            </h2>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-page)' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Event Title
            </label>
            <input
              type="text"
              value={config.eventName}
              onChange={e => setConfig({ ...config, eventName: e.target.value })}
              style={{ fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Minimum Age Allowed
              </label>
              <input
                type="number"
                className="font-mono"
                value={config.ageRestrictions.minAge}
                onChange={e => setConfig({
                  ...config,
                  ageRestrictions: { ...config.ageRestrictions, minAge: parseInt(e.target.value, 10) || 0 }
                })}
                style={{ fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Maximum Age Allowed
              </label>
              <input
                type="number"
                className="font-mono"
                value={config.ageRestrictions.maxAge}
                onChange={e => setConfig({
                  ...config,
                  ageRestrictions: { ...config.ageRestrictions, maxAge: parseInt(e.target.value, 10) || 100 }
                })}
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Active Student Only Event</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requires accredited college enrollment / valid student proof</div>
            </div>
            <input
              type="checkbox"
              checked={config.studentOnly}
              onChange={e => setConfig({ ...config, studentOnly: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Require Live Biometric Selfie</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enforces webcam face match against ID photo</div>
            </div>
            <input
              type="checkbox"
              checked={config.requireFaceMatch}
              onChange={e => setConfig({ ...config, requireFaceMatch: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
            />
          </div>

          <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auto-Approve Trust Threshold</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{config.thresholds.autoApproveScore}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={95}
              value={config.thresholds.autoApproveScore}
              onChange={e => setConfig({
                ...config,
                thresholds: { ...config.thresholds, autoApproveScore: parseInt(e.target.value, 10) }
              })}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            <Check size={15} />
            <span>{isSaving ? 'Saving...' : 'Apply Rules'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
