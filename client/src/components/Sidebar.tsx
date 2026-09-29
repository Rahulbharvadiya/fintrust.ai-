// Dual-Mode Sidebar with Full Hackathon OS v2 Navigation & Theme Controls
import React from 'react';
import { 
  ShieldCheck, Users, HelpCircle, UploadCloud, 
  Radar, Award, Calendar, Sliders, RotateCcw, 
  Sparkles, KeyRound, ChevronRight
} from 'lucide-react';

export type MainTabType = 
  | 'identity-verification'
  | 'team-matchmaking'
  | 'mentor-helpdesk'
  | 'project-submission'
  | 'fraud-radar'
  | 'judging-deliberation'
  | 'live-operations';

export type ThemePreference = 'light' | 'dark';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  reviewCount: number;
  themePreference?: ThemePreference;
  setThemePreference?: (pref: ThemePreference) => void;
  onOpenRules: () => void;
  onOpenAiConfig: () => void;
  onResetDemo: () => void;
  onToggleTestVectors: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  reviewCount,
  onOpenRules,
  onOpenAiConfig,
  onResetDemo,
  onToggleTestVectors
}) => {
  return (
    <aside style={{
      width: '270px',
      minWidth: '270px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      minHeight: '100vh',
      boxShadow: 'var(--shadow-subtle)',
      transition: 'background-color 200ms ease, border-color 200ms ease'
    }}>
      <div>
        {/* Brand Logo & Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '18px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.35)'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                FinTrust<span style={{ color: 'var(--brand-primary)' }}>.ai</span>
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hackathon OS • v2.0
            </p>
          </div>
        </div>

        {/* SECTION 1: PARTICIPANT PORTAL */}
        <div style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-dim)',
          marginBottom: '8px',
          paddingLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Participant Portal</span>
          <span style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: 'var(--status-ok-bg)',
            color: 'var(--status-ok-text)',
            fontWeight: 700
          }}>
            Fintech Clean
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '20px' }}>
          {[
            { id: 'identity-verification', label: 'ID Verification & Pass', icon: ShieldCheck },
            { id: 'team-matchmaking', label: 'Team Matchmaking Hub', icon: Users },
            { id: 'mentor-helpdesk', label: 'Mentor Helpdesk Queue', icon: HelpCircle },
            { id: 'project-submission', label: 'Project Submission', icon: UploadCloud }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as MainTabType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSel ? '1px solid var(--border-active)' : '1px solid transparent',
                  backgroundColor: isSel ? 'var(--brand-glow)' : 'transparent',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {isSel && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        {/* SECTION 2: ORGANIZER & SOC COMMAND CENTER */}
        <div style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-dim)',
          marginBottom: '8px',
          paddingLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>SOC Command Center</span>
          <span style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: 'var(--status-warn-bg)',
            color: 'var(--status-warn-text)',
            fontWeight: 700
          }}>
            Forensic Dark
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {[
            { id: 'fraud-radar', label: 'Fraud Radar & Sybil Graph', icon: Radar, badge: reviewCount > 0 ? reviewCount : null },
            { id: 'judging-deliberation', label: 'Judging & Deliberation', icon: Award },
            { id: 'live-operations', label: 'Live Operations & Gates', icon: Calendar }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as MainTabType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSel ? '1px solid var(--border-active)' : '1px solid transparent',
                  backgroundColor: isSel ? 'var(--brand-glow)' : 'transparent',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#F59E0B',
                    color: '#0B0F19',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                ) : (
                  isSel && <ChevronRight size={14} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER: THEME SWITCHER & SYSTEM TOOLS */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Action Buttons: Test Scenarios, Rules, AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={onToggleTestVectors}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Sparkles size={14} color="var(--brand-primary)" />
            <span>8 Test Scenarios</span>
          </button>

          <button
            onClick={onOpenRules}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Sliders size={14} color="var(--text-muted)" />
            <span>Eligibility Rules</span>
          </button>

          <button
            onClick={onOpenAiConfig}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <KeyRound size={14} color="var(--text-muted)" />
            <span>AI Cloud Engine</span>
          </button>

          <button
            onClick={onResetDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--status-danger-text)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Database</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
