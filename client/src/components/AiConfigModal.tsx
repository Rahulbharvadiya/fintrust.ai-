import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, Key, Zap } from 'lucide-react';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<any>(null);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveGeminiKey = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', geminiApiKey: geminiKey })
      });
      const data = await res.json();
      setMessage(data.message || (data.success ? 'Gemini API Key connected successfully!' : data.error));
      fetchStatus();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
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
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '620px',
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={20} color="var(--brand-primary)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Trust Engine Configuration
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Multi-Modal Intelligence Stack & API Credentials
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: 'var(--bg-page)' }}>
          
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-glow)',
              border: '1px solid var(--border-color)',
              color: 'var(--brand-primary)',
              fontSize: '13px'
            }}>
              {message}
            </div>
          )}

          {/* AI Stack Breakdown Explanation */}
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--brand-primary)" />
              <span>Engine Processing Architecture</span>
            </h3>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '18px' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Google Gemini Multimodal Vision:</strong> AI-powered document inspection, layout recognition, and zero-shot accreditation.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Local Computer Vision & Forensics:</strong> Error Level Analysis (ELA), typography consistency analysis, and biometric facial vector comparison.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Official UIDAI Verhoeff Checksum:</strong> Dihedral group mathematical validation for government identification numbers.
              </li>
            </ul>
          </div>

          {/* Gemini API Configuration */}
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} color="var(--brand-primary)" />
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Google Gemini Multimodal API Key
                </h4>
              </div>
              <span className={status?.gemini?.isConfigured ? 'badge-success' : 'badge-neutral'} style={{ fontSize: '11px' }}>
                {status?.gemini?.mode || 'LOCAL FORENSIC ENGINE'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Enter an optional Gemini API key to enable cloud multimodal analysis alongside local computer vision models.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="password"
                className="font-mono"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                style={{ fontSize: '13px' }}
              />
              <button
                onClick={saveGeminiKey}
                disabled={isLoading || !geminiKey}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Check size={14} /> Connect Key
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
