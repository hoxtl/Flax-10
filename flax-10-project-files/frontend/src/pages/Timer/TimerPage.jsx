import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import AppPage from "../../components/common/AppPage/AppPage";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import analyticsService from "../../api/analyticsService";
import {
  MainSection,
  PopupSection,
  RightPanel,
  FocusOverlayContent,
} from "../../components/Timer/WrapperComponents";
import WordLoader from "../../components/ui/word-loader";
import useBreakpoint from "../../hooks/useBreakpoint";

const MIN_FOCUS_SKELETON_MS = 500;

const SHORTCUTS = [
  { key: 'Space', desc: 'Start / Pause' },
  { key: 'R', desc: 'Reset timer' },
  { key: 'F', desc: 'Focus mode' },
  { key: 'Esc', desc: 'Exit overlays' },
  { key: '?', desc: 'Show this help' },
];

function fmtHours(h) {
    if (!h || h <= 0) return '0m';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
}

function ShortcutsModal({ onClose }) {
    return (
        <div className={styles.shortcutsOverlay} onClick={onClose}>
            <div className={styles.shortcutsModal} onClick={e => e.stopPropagation()}>
                <span className={styles.shortcutsTitle}>Keyboard Shortcuts</span>
                <div className={styles.shortcutsList}>
                    {SHORTCUTS.map(s => (
                        <div key={s.key} className={styles.shortcutRow}>
                            <kbd className={styles.shortcutKey}>{s.key}</kbd>
                            <span className={styles.shortcutDesc}>{s.desc}</span>
                        </div>
                    ))}
                </div>
                <button className={styles.shortcutsClose} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

function TodayBanner({ onStreakData }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [goalHours, setGoalHours] = useState(() =>
        parseFloat(localStorage.getItem('timerDailyGoalHours') || '4'));
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    useEffect(() => {
        analyticsService.getSummary(1)
            .then(res => {
                const summary = res?.summary ?? null;
                setData(summary);
                if (onStreakData) onStreakData(summary);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [onStreakData]);

    const sessions = data?.total_sessions ?? 0;
    const hours = data?.total_study_hours ?? 0;
    const streak = data?.current_streak_days ?? 0;
    const pct = Math.min(100, goalHours > 0 ? Math.round((hours / goalHours) * 100) : 0);

    const commitGoal = (val) => {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) {
            setGoalHours(n);
            try { localStorage.setItem('timerDailyGoalHours', String(n)); } catch {}
        }
        setEditingGoal(false);
    };

    if (loading) return null;

    return (
        <div className={styles.todayBanner}>
            <div className={styles.todayBannerLeft}>
                {streak > 0 && (
                    <div className={styles.todayStatChip}>
                        <span className={styles.todayStatValue}>🔥 {streak}d</span>
                        <span className={styles.todayStatLabel}>streak</span>
                    </div>
                )}
                {sessions > 0 && (
                    <>
                        {streak > 0 && <div className={styles.todayBannerDivider} />}
                        <div className={styles.todayStatChip}>
                            <span className={styles.todayStatValue}>{sessions}</span>
                            <span className={styles.todayStatLabel}>sessions</span>
                        </div>
                        <div className={styles.todayBannerDivider} />
                        <div className={styles.todayStatChip}>
                            <span className={styles.todayStatValue}>{fmtHours(hours)}</span>
                            <span className={styles.todayStatLabel}>focused</span>
                        </div>
                    </>
                )}
            </div>
            <div className={styles.todayBannerRight}>
                <div className={styles.todayGoalInlineBar}>
                    <div className={styles.todayGoalInlineFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.todayGoalInlineMeta}>
                    {pct}% of{' '}
                    {editingGoal ? (
                        <input
                            className={styles.todayGoalInput}
                            type="number"
                            min={0.5} max={24} step={0.5}
                            value={goalInput}
                            autoFocus
                            onChange={e => setGoalInput(e.target.value)}
                            onBlur={() => commitGoal(goalInput)}
                            onKeyDown={e => { if (e.key === 'Enter') commitGoal(goalInput); if (e.key === 'Escape') setEditingGoal(false); }}
                        />
                    ) : (
                        <button className={styles.todayGoalEditBtn} onClick={() => { setGoalInput(String(goalHours)); setEditingGoal(true); }}>
                            {goalHours}h goal
                        </button>
                    )}
                </span>
            </div>
        </div>
    );
}

function NotificationPrompt({ permission, request }) {
  if (permission !== "default") return null;
  return (
    <PrimaryButton onClick={request} className={styles.notificationBtn} pill>
      Enable Notifications
    </PrimaryButton>
  );
}

const FOCUS_WORDS = ["focus", "deep work", "lock in", "you've got this"];

function FocusPageSkeleton() {
  return (
    <div className={styles.focusPageSkeleton} data-testid="focus-page-skeleton" aria-busy="true">
      <div className={styles.focusPageSkeletonHeader}>
        <SkeletonBlock className={styles.focusPageSkeletonTitle} />
        <SkeletonBlock className={styles.focusPageSkeletonAction} />
      </div>
      <SkeletonBlock className={styles.focusPageSkeletonTask} />
      <SkeletonBlock className={styles.focusPageSkeletonTree} />
      <SkeletonBlock className={styles.focusPageSkeletonBadge} />
      <SkeletonBlock className={styles.focusPageSkeletonTime} />
      <div className={styles.focusPageSkeletonControls}>
        <SkeletonBlock className={styles.focusPageSkeletonBtnPrimary} />
        <SkeletonBlock className={styles.focusPageSkeletonBtnSecondary} />
        <SkeletonBlock className={styles.focusPageSkeletonBtnSecondary} />
      </div>
      <div className={styles.focusPageSkeletonSettings}>
        <div className={styles.focusPageSkeletonSetting}>
          <SkeletonBlock className={styles.focusPageSkeletonLabel} />
          <SkeletonBlock className={styles.focusPageSkeletonInput} />
        </div>
        <div className={styles.focusPageSkeletonSetting}>
          <SkeletonBlock className={styles.focusPageSkeletonLabel} />
          <SkeletonBlock className={styles.focusPageSkeletonInput} />
        </div>
        <div className={styles.focusPageSkeletonSetting}>
          <SkeletonBlock className={styles.focusPageSkeletonLabel} />
          <SkeletonBlock className={styles.focusPageSkeletonInput} />
        </div>
      </div>
      <div className={styles.focusPageSkeletonSound}>
        <SkeletonBlock className={styles.focusPageSkeletonLabelWide} />
        <SkeletonBlock className={styles.focusPageSkeletonSoundInput} />
      </div>
    </div>
  );
}

function HistoryButton({ onClick }) {
  return (
    <PrimaryButton onClick={onClick} pill>
      History 📜
    </PrimaryButton>
  );
}

function FocusModeButton({ onClick }) {
  return (
    <PrimaryButton onClick={onClick} pill variant="secondary">
      Focus ⚡
    </PrimaryButton>
  );
}

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [showBackBtn, setShowBackBtn] = useState(false);
  const backBtnTimer = useRef(null);
  const { permission, request } = useNotificationPermission();
  const isMobile = useBreakpoint();

  // Tab title countdown
  useEffect(() => {
    const APP_TITLE = 'StudyFlax';
    if (!t.isActive || t.isPaused) {
      document.title = APP_TITLE;
      return () => { document.title = APP_TITLE; };
    }
    const mm = String(Math.floor(t.timeLeft / 60)).padStart(2, '0');
    const ss = String(t.timeLeft % 60).padStart(2, '0');
    document.title = `${mm}:${ss} ${t.mode === 'break' ? '☕' : '🔥'} — ${APP_TITLE}`;
    return () => { document.title = APP_TITLE; };
  }, [t.isActive, t.isPaused, t.timeLeft, t.mode]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?') {
      e.preventDefault();
      setShowShortcuts(s => !s);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (t.isActive) { t.togglePause(); } else { t.setIsActive(true); }
    } else if (e.key === 'r' || e.key === 'R') {
      t.resetTimer();
    } else if (e.key === 'f' || e.key === 'F') {
      setFocusMode(f => !f);
    } else if (e.key === 'Escape') {
      setFocusMode(false);
      setShowShortcuts(false);
    }
  }, [t]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!showFocusTransition) return;
    const id = setTimeout(() => setShowFocusTransition(false), 5000);
    return () => clearTimeout(id);
  }, [showFocusTransition]);

  useEffect(() => {
    if (!focusMode) { setShowBackBtn(false); return; }
    const show = () => {
      setShowBackBtn(true);
      clearTimeout(backBtnTimer.current);
      backBtnTimer.current = setTimeout(() => setShowBackBtn(false), 2000);
    };
    window.addEventListener('mousemove', show);
    return () => {
      window.removeEventListener('mousemove', show);
      clearTimeout(backBtnTimer.current);
    };
  }, [focusMode]);

  useEffect(() => {
    const id = setTimeout(() => setShowPageSkeleton(false), MIN_FOCUS_SKELETON_MS);
    return () => clearTimeout(id);
  }, []);

  const fromTaskPlay = Boolean(location.state?.fromTaskPlay);

  // Streak at risk: after 6pm, streak exists, 0 sessions today
  const hour = new Date().getHours();
  const streakAtRisk = streakData !== null
    && !dismissedWarning
    && (streakData.current_streak_days ?? 0) > 0
    && (streakData.total_sessions ?? 0) === 0
    && hour >= 18;

  return (
    <AppPage
      width="lg"
      title="Study Timer"
      action={!isMobile ? (
        <div className={styles.pageActions}>
          <FocusModeButton onClick={() => setFocusMode(true)} />
          <HistoryButton onClick={() => setShowHistory(true)} />
        </div>
      ) : undefined}
      className={fromTaskPlay && showFocusTransition ? styles.containerFocusEntering : ""}
    >
      {showPageSkeleton && <FocusPageSkeleton />}
      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <WordLoader words={FOCUS_WORDS} className={styles.focusModeTransitionText} />
        </div>
      )}

      {/* Full-screen focus overlay */}
      {focusMode && (
        <div className={styles.focusOverlay}>
          <button className={styles.focusOverlayClose} onClick={() => setFocusMode(false)}>✕ Exit focus</button>
          <button
            className={`${styles.focusBackBtn} ${showBackBtn ? styles.focusBackBtnVisible : ''}`}
            onClick={() => setFocusMode(false)}
            aria-label="Exit focus mode"
          >
            ← Back
          </button>
          <FocusOverlayContent t={t} />
        </div>
      )}

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      <div
        className={`${styles.timerLayout} ${fromTaskPlay ? styles.focusModeContent : ""}`}
        style={showPageSkeleton ? { visibility: "hidden" } : undefined}
      >
        <NotificationPrompt permission={permission} request={request} />

        {streakAtRisk && (
          <div className={styles.streakWarning}>
            ⚠️ Study today to keep your {streakData.current_streak_days}-day streak!
            <button className={styles.streakWarningClose} onClick={() => setDismissedWarning(true)}>✕</button>
          </div>
        )}

        <TodayBanner onStreakData={setStreakData} />

        <div className={styles.timerGrid}>
          <div className={styles.timerGridLeft}>
            <MainSection t={t} onOpenHistory={() => setShowHistory(true)} isMobile={isMobile} />
          </div>
          <RightPanel t={t} />
        </div>
        <PopupSection t={t} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
      </div>
    </AppPage>
  );
}
