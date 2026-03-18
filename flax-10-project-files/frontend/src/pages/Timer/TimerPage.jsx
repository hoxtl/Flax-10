import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import AppPage from "../../components/common/AppPage/AppPage";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import PageTransition from "../../components/common/PageTransition/PageTransition";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import analyticsService from "../../api/analyticsService";
import { getNearestMilestone } from "../../components/Timer/utils/milestoneUtils";
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

const FLAX_FOCUS_ACCENT = "#7a6a56";

function getAccentFromTimerPreset(timer) {
  void timer;
  return FLAX_FOCUS_ACCENT;
}

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

function TodayBanner({ onStreakData, isStudying = false }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthSummary, setMonthSummary] = useState(null);
    const [goalHours, setGoalHours] = useState(() =>
        parseFloat(localStorage.getItem('timerDailyGoalHours') || '4'));
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [lastSessionCount, setLastSessionCount] = useState(null);
    const [fillAnimating, setFillAnimating] = useState(false);
    const [counterAnimating, setCounterAnimating] = useState(false);

    const refresh = useCallback(() => {
        analyticsService.getSummary(1)
            .then(res => {
                const summary = res?.summary ?? null;
                setData(summary);
                if (onStreakData) onStreakData(summary);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        analyticsService.getSummary(30)
            .then((res) => setMonthSummary(res?.summary ?? null))
            .catch(() => setMonthSummary(null));
    }, [onStreakData]);

    useEffect(() => {
        refresh();
        window.addEventListener('timerHistoryUpdated', refresh);
        window.addEventListener('historyCleared', refresh);
        return () => {
            window.removeEventListener('timerHistoryUpdated', refresh);
            window.removeEventListener('historyCleared', refresh);
        };
    }, [refresh]);

    const sessions = data?.total_sessions ?? 0;
    const hours = data?.total_study_hours ?? 0;
    const streak = data?.current_streak_days ?? 0;
    const goalSessions = Math.max(1, Math.ceil((goalHours * 60) / 25));
    const sessionPct = Math.min(100, Math.round((sessions / goalSessions) * 100));
    const milestone = monthSummary
        ? getNearestMilestone(
            Number(monthSummary.total_sessions ?? 0),
            Number(monthSummary.current_streak_days ?? 0),
            Number(monthSummary.total_study_hours ?? 0)
        )
        : null;
    const milestoneHint = milestone
        ? `${milestone.remaining} away from ${milestone.label}`
        : null;
    const weeklyProgressDays = Math.max(0, Math.min(7, streak > 0 && streak % 7 === 0 ? 7 : streak % 7));
    const weeklyGoalText = `🔥 ${weeklyProgressDays}/7 days towards your weekly goal`;
    const streakTooltip = milestoneHint || weeklyGoalText;
    const tickCount = Math.max(2, Math.min(goalSessions, 16));
    const activePulseLeft = Math.min(
        98,
        Math.max(2, ((Math.min(sessions, goalSessions - 1) + 0.5) / goalSessions) * 100)
    );

    useEffect(() => {
        if (lastSessionCount == null) {
            setLastSessionCount(sessions);
            return;
        }
        if (sessions !== lastSessionCount) {
            setFillAnimating(true);
            setCounterAnimating(true);
            const fillTimer = setTimeout(() => setFillAnimating(false), 900);
            const counterTimer = setTimeout(() => setCounterAnimating(false), 480);
            setLastSessionCount(sessions);
            return () => {
                clearTimeout(fillTimer);
                clearTimeout(counterTimer);
            };
        }
    }, [sessions, lastSessionCount]);

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
        <div className={styles.todayRibbon}>
            <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneLeft}`}>
                <span className={styles.todayRibbonStreakWrap} data-tooltip={streakTooltip}>
                    <span className={styles.todayRibbonStreakIcon}>🔥</span>
                    <span className={styles.todayRibbonStreakValue}>{streak}d</span>
                </span>
            </div>
            <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneCenter}`}>
                <div className={styles.todayRibbonHeroRow}>
                    <span className={styles.todayRibbonSessionsText}>
                        <span className={styles.todayRibbonSessionDigitWrap}>
                            <span key={sessions} className={`${styles.todayRibbonSessionDigit} ${counterAnimating ? styles.todayRibbonSessionDigitAnimate : ''}`}>{Math.min(sessions, goalSessions)}</span>
                        </span>
                        /{goalSessions} sessions today{sessions > goalSessions ? ` (+${sessions - goalSessions} extra)` : ''}
                    </span>
                    <span className={styles.todayRibbonMilestoneActive}>{weeklyGoalText}</span>
                </div>
                <div className={styles.todayRibbonScale}>
                    <span>0</span>
                    <span>{goalSessions}</span>
                </div>
                <div className={styles.todayRibbonBar}>
                    <div
                        className={`${styles.todayRibbonFill} ${fillAnimating ? styles.todayRibbonFillAnimate : ''} ${isStudying ? styles.todayRibbonFillLive : ''}`}
                        style={{ width: `${sessionPct}%` }}
                    >
                        <span className={styles.todayRibbonFillShimmer} />
                    </div>
                    <div className={styles.todayRibbonTickLayer}>
                        {Array.from({ length: tickCount + 1 }).map((_, idx) => (
                            <span
                                key={`tick-${idx}`}
                                className={styles.todayRibbonTick}
                                style={{ left: `${(idx / tickCount) * 100}%` }}
                            />
                        ))}
                    </div>
                    {isStudying && sessions < goalSessions ? (
                        <span className={styles.todayRibbonActivePulse} style={{ left: `calc(${activePulseLeft}% - 4px)` }} />
                    ) : null}
                </div>
            </div>
            <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneRight}`}>
                <span className={styles.todayRibbonFocusValue}>🕒 {fmtHours(hours)}</span>
                <span className={styles.todayRibbonMeta}>
                    Goal:{' '}
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
                            {goalHours}h
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
      <div className={styles.focusPageSkeletonCanvas}>
        <div className={styles.focusPageSkeletonMainCol}>
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
        </div>
        <div className={styles.focusPageSkeletonRightCol}>
          <SkeletonBlock className={styles.focusPageSkeletonRightCard} />
          <SkeletonBlock className={styles.focusPageSkeletonRightCardTall} />
        </div>
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

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusFullscreenPending, setFocusFullscreenPending] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const { permission, request } = useNotificationPermission();
  const isMobile = useBreakpoint();
  const focusAccent = getAccentFromTimerPreset(t);

  const openFocusMode = useCallback(() => {
    setFocusMode(true);
    setFocusFullscreenPending(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--timer-focus-accent", focusAccent);
    return () => {
      document.documentElement.style.removeProperty("--timer-focus-accent");
    };
  }, [focusAccent]);

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
      if (focusMode) {
        setFocusMode(false);
      } else {
        openFocusMode();
      }
    } else if (e.key === 'Escape') {
      setFocusMode(false);
      setShowShortcuts(false);
    }
  }, [t, focusMode, openFocusMode]);

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
    const id = setTimeout(() => setShowPageSkeleton(false), MIN_FOCUS_SKELETON_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let id;
    if (focusMode && focusFullscreenPending) {
      id = window.setTimeout(() => {
        if (!document.fullscreenElement && root?.requestFullscreen) {
          root.requestFullscreen().catch(() => {});
        }
        setFocusFullscreenPending(false);
      }, 220);
      return () => clearTimeout(id);
    }
    if (!focusMode) {
      setFocusFullscreenPending(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    return () => {
      if (id) clearTimeout(id);
    };
  }, [focusMode, focusFullscreenPending]);

  const fromTaskPlay = Boolean(location.state?.fromTaskPlay);

  // Streak at risk: after 6pm, streak exists, 0 sessions today
  const hour = new Date().getHours();
  const streakAtRisk = streakData !== null
    && !dismissedWarning
    && (streakData.current_streak_days ?? 0) > 0
    && (streakData.total_sessions ?? 0) === 0
    && hour >= 18;

  const timerLayoutStyle = {
    "--focus-accent": focusAccent,
    ...(showPageSkeleton ? { visibility: "hidden" } : {}),
  };

  return (
    <AppPage
      width="lg"
      title="Focus Timer"
      action={null}
      className={fromTaskPlay && showFocusTransition ? styles.containerFocusEntering : ""}
    >
      <ScrollToTop />
      {showPageSkeleton && <FocusPageSkeleton />}
      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <WordLoader words={FOCUS_WORDS} className={styles.focusModeTransitionText} />
        </div>
      )}

      {/* Full-screen focus overlay */}
      <AnimatePresence mode="wait" initial={false}>
        {focusMode && (
          <PageTransition
            className={styles.focusOverlay}
            style={{ "--focus-accent": focusAccent }}
          >
            <FocusOverlayContent
              t={t}
              streakData={streakData}
              onExitFocus={() => {
                setFocusMode(false);
                navigate('/timer');
              }}
            />
          </PageTransition>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      <div
        className={`${styles.timerLayout} ${fromTaskPlay ? styles.focusModeContent : ""}`}
        style={timerLayoutStyle}
      >
        <NotificationPrompt permission={permission} request={request} />
        {fromTaskPlay && !focusMode && (
          <BackButton
            className={styles.focusEntryBackBtn}
            onClick={() => navigate(-1)}
            label="Back"
          />
        )}

        {streakAtRisk && (
          <div className={styles.streakWarning}>
            ⚠️ Study today to keep your {streakData.current_streak_days}-day streak!
            <button className={styles.streakWarningClose} onClick={() => setDismissedWarning(true)}>✕</button>
          </div>
        )}

        <TodayBanner
          onStreakData={setStreakData}
          isStudying={Boolean(t.isActive && !t.isPaused)}
        />

        <div className={styles.timerGrid}>
          <div className={styles.timerGridLeft}>
            <MainSection
              t={t}
              onOpenHistory={() => setShowHistory(true)}
              onOpenFocus={openFocusMode}
              isMobile={isMobile}
            />
          </div>
          <RightPanel t={t} />
        </div>
        <PopupSection t={t} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
      </div>
    </AppPage>
  );
}
