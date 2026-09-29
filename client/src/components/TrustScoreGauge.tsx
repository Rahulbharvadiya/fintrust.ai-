// Senior-Level Hero Element: Circular Trust Score Gauge with 4 Sub-Score Bars
import React from 'react';
import type { ScoreBreakdown } from '../types';

interface TrustScoreGaugeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  status?: string;
  size?: number;
  label?: string;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score = 0,
  breakdown = {
    authenticity: 95,
    faceBiometrics: 94,
    identityEligibility: 100,
    deduplication: 98
  },
  status = 'VERIFIED',
  size = 140,
  label = 'Overall Trust Score'
}) => {
  // Clamped score
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  // Tier color mapping
  let tierColor = '#10B981'; // Green
  let tierBg = 'var(--status-ok-bg)';
  let tierText = 'VERIFIED';

  if (safeScore < 60 || status === 'REJECTED') {
    tierColor = '#EF4444'; // Red
    tierBg = 'var(--status-danger-bg)';
    tierText = 'REJECTED / RISK';
  } else if (safeScore < 85 || status === 'REVIEW_NEEDED') {
    tierColor = '#F59E0B'; // Amber
    tierBg = 'var(--status-warn-bg)';
    tierText = 'REVIEW NEEDED';
  }

  // SVG Geometry
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  // Normalize each sub-score to 0 - 100% scale (auto-scales legacy point-sum buckets if present)
  const getScenarioPercentage = (val: number | undefined, legacyMaxBucket: number): number => {
    if (val === undefined || val === null) return safeScore;
    
    // Detect legacy weighted point bucket representation where bucket points summed to overall score
    const authVal = breakdown?.authenticity ?? 0;
    const faceVal = breakdown?.faceBiometrics ?? 0;
    const eligVal = breakdown?.identityEligibility ?? 0;
    const dedupVal = breakdown?.deduplication ?? 0;
    const isLegacyPointSum = (
      authVal <= 30 &&
      faceVal <= 25 &&
      eligVal <= 25 &&
      dedupVal <= 20 &&
      (authVal + faceVal + eligVal + dedupVal === safeScore)
    );

    if (isLegacyPointSum && legacyMaxBucket < 100) {
      return Math.max(0, Math.min(100, Math.round((val / legacyMaxBucket) * 100)));
    }

    return Math.max(0, Math.min(100, Math.round(val)));
  };

  const subScores = [
    { label: 'Authenticity & ELA', value: getScenarioPercentage(breakdown.authenticity, 30) },
    { label: 'Face Match Landmark', value: getScenarioPercentage(breakdown.faceBiometrics, 25) },
    { label: 'Eligibility Rules', value: getScenarioPercentage(breakdown.identityEligibility, 25) },
    { label: 'Sybil & Dedup Graph', value: getScenarioPercentage(breakdown.deduplication, 20) }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      width: '100%'
    }}>
      {/* Label & Status Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: tierColor,
          backgroundColor: tierBg,
          padding: '2px 8px',
          borderRadius: 'var(--radius-xs)',
          letterSpacing: '0.05em',
          border: `1px solid ${tierColor}40`
        }}>
          {tierText}
        </span>
      </div>

      {/* Hero Circular Gauge */}
      <div style={{ position: 'relative', width: size, height: size, margin: '8px 0 16px 0' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bg-surface-subtle)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Filled Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tierColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease'
            }}
          />
        </svg>

        {/* Center Number Display */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span className="machine-data" style={{
            fontSize: '34px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}>
            {safeScore}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}>
            out of 100
          </span>
        </div>
      </div>

      {/* 4 Small Horizontal Sub-Score Bars Underneath */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {subScores.map((sub, i) => {
          const subSafe = Math.max(0, Math.min(100, Math.round(sub.value)));
          let barColor = '#10B981';
          if (subSafe < 60) barColor = '#EF4444';
          else if (subSafe < 85) barColor = '#F59E0B';

          return (
            <div key={i} style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '3px'
              }}>
                <span>{sub.label}</span>
                <span className="machine-data" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {subSafe}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: '99px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${subSafe}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: '99px',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
