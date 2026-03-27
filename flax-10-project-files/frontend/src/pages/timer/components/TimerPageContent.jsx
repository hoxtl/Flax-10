/*
 * Timer page presentation.
 */

import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../TimerPage.module.css';
import AppPage from '../../../components/common/app_page/AppPage';
import BackButton from '../../../components/common/back_button/BackButton.jsx';
import PageTransition from '../../../components/common/page_transition/PageTransition';
import ScrollToTop from '../../../components/common/scroll_to_top/ScrollToTop';
import TodayBanner from '../../../components/timer/components/TodayBanner';
import { MainSection, PopupSection, RightPanel, FocusOverlayContent } from '../../../components/timer/components/WrapperComponents';
import WordLoader from '../../../components/ui/components/WordLoader';
import { FocusPageSkeleton } from './FocusPageSkeleton';
import { NotificationPrompt } from './NotificationPrompt';
import { ShortcutsModal } from './ShortcutsModal';

const FOCUS_WORDS = ['focus', 'lock in', "you've got this"];

const timerSubtitle = (
  <>
    Build <em>deep focus</em>, <em>study sprints</em>, and <em>calm revision blocks</em>.
  </>
);

function FocusTransition({ show }) {
  if (!show) return null;

  return (
    <div className={styles.focusModeTransition} aria-live="polite">
      <WordLoader words={FOCUS_WORDS} className={styles.focusModeTransitionText} />
    </div>
  );
}

function FocusOverlayLayer({ state }) {
  const navigate = useNavigate();
  return (
    <PageTransition className={styles.focusOverlay} style={{ '--focus-accent': state.focusAccent }}>
      <FocusOverlayContent t={state.t} onExitFocus={() => exitFocus(state, navigate)} />
    </PageTransition>
  );
}

function exitFocus(state, navigate) {
  state.setFocusMode(false);
  navigate('/timer');
}

function StreakWarning({ state }) {
  if (!isStreakAtRisk(state)) return null;

  return (
    <div className={styles.streakWarning}>
      ⚠️ Study today to keep your {state.streakData.current_streak_days}-day streak!
      <button className={styles.streakWarningClose} onClick={() => state.setDismissedWarning(true)}>✕</button>
    </div>
  );
}

function isStreakAtRisk(state) {
  const hour = new Date().getHours();
  return state.streakData !== null && !state.dismissedWarning && (state.streakData.current_streak_days ?? 0) > 0 && (state.streakData.total_sessions ?? 0) === 0 && hour >= 18;
}

function FocusEntryBackButton({ state, navigate }) {
  if (!state.fromTaskPlay || state.focusMode) return null;
  return <BackButton className={styles.focusEntryBackBtn} onClick={() => navigate(-1)} label="Back" />;
}

function TimerTopSplit({ state }) {
  return (
    <div className={styles.timerTopSplit}>
      <div className={styles.timerTopLeft}>
        <MainSection t={state.t} onOpenHistory={() => state.setShowHistory(true)} onOpenFocus={state.openFocusMode} isMobile={state.isMobile} />
      </div>
      <div className={styles.timerTopRight}>
        <RightPanel t={state.t} />
      </div>
    </div>
  );
}

function TimerLayout({ state }) {
  const navigate = useNavigate();
  const visibility = state.showPageSkeleton ? { visibility: 'hidden' } : {};
  const className = `${styles.timerLayout} ${state.fromTaskPlay ? styles.focusModeContent : ''}`;
  const timerLayoutStyle = Object.assign({ '--focus-accent': state.focusAccent }, visibility);

  return (
    <div className={className} style={timerLayoutStyle}>
      <NotificationPrompt permission={state.permission} request={state.request} />
      <FocusEntryBackButton state={state} navigate={navigate} />
      <StreakWarning state={state} />
      <TodayBanner onStreakData={state.setStreakData} />
      <TimerTopSplit state={state} />
      <PopupSection t={state.t} showHistory={!state.focusMode && state.showHistory} onCloseHistory={() => state.setShowHistory(false)} />
    </div>
  );
}

export function TimerPageContent({ state }) {
  const pageClassName = state.fromTaskPlay && state.showFocusTransition ? styles.containerFocusEntering : '';

  return (
    <AppPage width="lg" title="Focus Timer" subtitle={timerSubtitle} action={null} className={pageClassName}>
      <ScrollToTop />
      {state.showPageSkeleton && <FocusPageSkeleton />}
      <FocusTransition show={state.showFocusTransition} />
      <AnimatePresence mode="wait" initial={false}>
        {state.focusMode && <FocusOverlayLayer key="focus-overlay" state={state} />}
      </AnimatePresence>
      {state.showShortcuts && <ShortcutsModal onClose={() => state.setShowShortcuts(false)} />}
      <TimerLayout state={state} />
    </AppPage>
  );
}
