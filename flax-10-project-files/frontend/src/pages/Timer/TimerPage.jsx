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
import TodayBanner from "../../components/Timer/TodayBanner";
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

function NotificationPrompt({ permission, request }) {
  if (permission !== "default") return null;
  return (
    <PrimaryButton onClick={request} className={styles.notificationBtn} pill>
      Enable Notifications
    </PrimaryButton>
  );
}

const FOCUS_WORDS = ["focus", "lock in", "you've got this"];

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
  const focusAccent = FLAX_FOCUS_ACCENT;

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
