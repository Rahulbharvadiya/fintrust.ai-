// Dual-Mode Hackathon OS & Forensic Trust Engine Root Component
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { MainTabType, ThemePreference } from './components/Sidebar';
import { ParticipantPortal } from './components/ParticipantPortal';
import { TeamCollaborationHub } from './components/TeamCollaborationHub';
import { MentorHelpdeskQueue } from './components/MentorHelpdeskQueue';
import { ProjectSubmissionPipeline } from './components/ProjectSubmissionPipeline';
import { AdminDashboard } from './components/AdminDashboard';
import { JudgingConsole } from './components/JudgingConsole';
import { LiveOperationsConsole } from './components/LiveOperationsConsole';
import { TestCasesDrawer } from './components/TestCasesDrawer';
import { RulesModal } from './components/RulesModal';
import { AiConfigModal } from './components/AiConfigModal';
import { Bell, Sun, Moon } from 'lucide-react';
import type { RegistrationRecord, TestVector } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabType>('identity-verification');
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('hackathon_theme');
    return (saved === 'dark' || saved === 'light') ? (saved as ThemePreference) : 'light';
  });
  const [testVectors, setTestVectors] = useState<TestVector[]>([]);
  const [selectedTestVector, setSelectedTestVector] = useState<TestVector | null>(null);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Compute effective theme directly from 2-option preference (Light or Dark)
  const effectiveTheme: 'theme-light' | 'theme-dark' = themePreference === 'dark' ? 'theme-dark' : 'theme-light';

  // Apply theme class to document element and persist preference
  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(effectiveTheme);
    localStorage.setItem('hackathon_theme', themePreference);
  }, [effectiveTheme, themePreference]);

  // Fetch initial test vectors and stats
  const fetchInitialData = async () => {
    try {
      const [vectorsRes, statsRes] = await Promise.all([
        fetch('/api/test-vectors'),
        fetch('/api/stats')
      ]);

      const vectorsData = await vectorsRes.json();
      const statsData = await statsRes.json();

      if (vectorsData.success) {
        setTestVectors(vectorsData.testVectors);
      }
      if (statsData.success) {
        setReviewCount(statsData.stats.reviewQueue);
      }
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [refreshCounter]);

  const handleVerificationComplete = (_record: RegistrationRecord) => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleSelectTestVector = (vector: TestVector) => {
    setSelectedTestVector(vector);
    setActiveTab('identity-verification');
  };

  const handleResetDemo = async () => {
    if (window.confirm('Restore system database to clean initial seed records?')) {
      try {
        await fetch('/api/reset-demo', { method: 'POST' });
        setSelectedTestVector(null);
        setRefreshCounter(prev => prev + 1);
      } catch (err) {
        console.error('Reset error:', err);
      }
    }
  };

  const getTabTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'identity-verification':
        return {
          title: 'Participant Identity & Eligibility Verification',
          subtitle: 'Dual-Engine OCR, UIDAI Verhoeff Checksum & Biometric Face Match'
        };
      case 'team-matchmaking':
        return {
          title: 'Team Formation & Matchmaking Directory',
          subtitle: 'Find Teammates by Missing Skillsets, Member Caps & Discord/Slack Webhooks'
        };
      case 'mentor-helpdesk':
        return {
          title: 'Live Mentor Helpdesk Queue & Routing',
          subtitle: 'Request Technical Guidance, Log Blockers & Track Available Mentors'
        };
      case 'project-submission':
        return {
          title: 'Project Submission & Cryptographic Receipting',
          subtitle: 'Repository Verification, Live Demo Endpoints & SHA-256 HMAC Proofs'
        };
      case 'fraud-radar':
        return {
          title: 'SOC Forensic Fraud Radar & Sybil Graph',
          subtitle: 'Error Level Analysis (ELA), Typography Baselines & Syndicate Account Defense'
        };
      case 'judging-deliberation':
        return {
          title: 'Judging Console & Z-Score Normalization',
          subtitle: '4-Pillar Weighted Rubric, Blind Reviews & Score Variance Tabulation'
        };
      case 'live-operations':
        return {
          title: 'Live Event Operations, Schedule & Gate Scanner',
          subtitle: 'Real-Time Schedule Shifts, Announcements Broadcast & Venue Check-Ins'
        };
      default:
        return { title: 'Hackathon OS', subtitle: 'Identity & Event Operations Engine' };
    }
  };

  const { title, subtitle } = getTabTitleAndSubtitle();

  return (
    <div className={effectiveTheme} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-page)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      transition: 'background-color 200ms ease, color 200ms ease'
    }}>
      {/* Column 1: Dual Mode Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviewCount={reviewCount}
        themePreference={themePreference}
        setThemePreference={setThemePreference}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenAiConfig={() => setIsAiModalOpen(true)}
        onResetDemo={handleResetDemo}
        onToggleTestVectors={() => setIsTestDrawerOpen(true)}
      />

      {/* Column 2: Main Dynamic Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        overflowX: 'hidden'
      }}>
        {/* Top Institutional Header */}
        <header style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: 'var(--shadow-subtle)',
          transition: 'background-color 200ms ease, border-color 200ms ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--brand-primary)',
                backgroundColor: 'var(--brand-glow)',
                border: '1px solid var(--border-color)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)'
              }}>
                HACKATHON OS v2.0
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {subtitle}
              </span>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Top-Right 2-Option Theme Switcher (Light / Dark) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              gap: '3px'
            }}>
              <button
                onClick={() => setThemePreference('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: themePreference === 'light' ? '1px solid var(--border-color)' : '1px solid transparent',
                  backgroundColor: themePreference === 'light' ? 'var(--bg-surface)' : 'transparent',
                  color: themePreference === 'light' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontWeight: themePreference === 'light' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: themePreference === 'light' ? 'var(--shadow-subtle)' : 'none',
                  transition: 'all 150ms ease'
                }}
                title="Light Mode"
                id="top-theme-btn-light"
              >
                <Sun size={14} color={themePreference === 'light' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                <span>Light</span>
              </button>

              <button
                onClick={() => setThemePreference('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: themePreference === 'dark' ? '1px solid var(--border-color)' : '1px solid transparent',
                  backgroundColor: themePreference === 'dark' ? 'var(--bg-surface)' : 'transparent',
                  color: themePreference === 'dark' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontWeight: themePreference === 'dark' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: themePreference === 'dark' ? 'var(--shadow-subtle)' : 'none',
                  transition: 'all 150ms ease'
                }}
                title="Dark Mode"
                id="top-theme-btn-dark"
              >
                <Moon size={14} color={themePreference === 'dark' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                <span>Dark</span>
              </button>
            </div>

            {/* Compliance Review Queue Alert Pill */}
            {reviewCount > 0 && (
              <button
                onClick={() => setActiveTab('fraud-radar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--status-warn-bg)',
                  border: '1px solid var(--status-warn-border)',
                  color: 'var(--status-warn-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
                title="Items awaiting compliance officer review"
              >
                <Bell size={13} />
                <span>{reviewCount} Review Needed</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Body */}
        <div style={{ flex: 1, padding: '24px 36px' }}>
          {activeTab === 'identity-verification' && (
            <ParticipantPortal
              onVerificationComplete={handleVerificationComplete}
              selectedTestVector={selectedTestVector}
              onClearTestVector={() => setSelectedTestVector(null)}
              onOpenTestVectors={() => setIsTestDrawerOpen(true)}
            />
          )}

          {activeTab === 'team-matchmaking' && (
            <TeamCollaborationHub
              onTeamUpdated={() => setRefreshCounter(prev => prev + 1)}
            />
          )}

          {activeTab === 'mentor-helpdesk' && (
            <MentorHelpdeskQueue />
          )}

          {activeTab === 'project-submission' && (
            <ProjectSubmissionPipeline />
          )}

          {activeTab === 'fraud-radar' && (
            <AdminDashboard
              onRefreshTrigger={refreshCounter}
            />
          )}

          {activeTab === 'judging-deliberation' && (
            <JudgingConsole />
          )}

          {activeTab === 'live-operations' && (
            <LiveOperationsConsole />
          )}
        </div>

        {/* Institutional Footer */}
        <footer style={{
          padding: '16px 36px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-surface)',
          transition: 'background-color 200ms ease, border-color 200ms ease'
        }}>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>FinTrust.ai</strong> • Autonomous Identity Verification & Hackathon Operating System v2.0
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600 }}>
            {effectiveTheme === 'theme-light' ? 'FINTECH CLEAN MODE' : 'SOC COMMAND CENTER MODE'} • Active
          </p>
        </footer>
      </div>

      {/* 8 Test Scenarios Drawer */}
      <TestCasesDrawer
        isOpen={isTestDrawerOpen}
        onClose={() => setIsTestDrawerOpen(false)}
        testVectors={testVectors}
        onSelectTestVector={handleSelectTestVector}
      />

      {/* Hackathon Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onRulesUpdated={() => setRefreshCounter(prev => prev + 1)}
      />

      {/* AI & AWS Cloud Architecture Modal */}
      <AiConfigModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};

export default App;
