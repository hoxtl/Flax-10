import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './TimerPage.module.css';
import { useNotificationPermission } from '../../components/Timer/utils/timerUtils';
import { useTimerContext } from '../../context/TimerContext';
import { MainSection, PopupSection } from '../../components/Timer/WrapperComponents';

function NotificationPrompt({ permission, request }) {
  if (permission !== 'default') return null;
  return <button onClick={request} className={styles.notificationBtn}>Enable Notifications</button>;
}

const ZOOM_IN_DURATION = 0.5;
const HOLD_DURATION = 1200;
const ZOOM_OUT_DURATION = 0.5;

function FocusModeTransition({ onComplete, onExiting }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => {
      setExiting(true);
      onExiting?.();
    }, HOLD_DURATION);
    return () => clearTimeout(holdTimer);
  }, [onExiting]);

  return (
    <motion.div
      className={styles.focusModeTransition}
      role="status"
      aria-live="polite"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        exiting
          ? { scale: 1.08, opacity: 0 }
          : { scale: 1, opacity: 1 }
      }
      transition={{
        duration: exiting ? ZOOM_OUT_DURATION : ZOOM_IN_DURATION,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onAnimationComplete={() => {
        if (exiting) onComplete();
      }}
    >
      <span className={styles.focusModeTransitionText}>Entering focus mode</span>
      <span className={styles.focusModeTransitionDot}>.</span>
    </motion.div>
  );
}

export default function TimerPage() {
  const location = useLocation();
  const timerData = useTimerContext();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => !!location.state?.fromTaskPlay);
  const [animateTimerIn, setAnimateTimerIn] = useState(false);
  const { permission, request } = useNotificationPermission();

  const handleFocusTransitionComplete = () => {
    setShowFocusTransition(false);
    setAnimateTimerIn(true);
  };

  return (
    <div className={styles.container}>
      <NotificationPrompt permission={permission} request={request} />
      {showFocusTransition ? (
        <FocusModeTransition
          onComplete={handleFocusTransitionComplete}
          onExiting={() => {}}
        />
      ) : (
        <motion.div
          className={styles.mainContentWrap}
          initial={animateTimerIn ? { scale: 0.94, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: animateTimerIn ? 0.4 : 0,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          onAnimationComplete={() => setAnimateTimerIn(false)}
        >
          <MainSection t={timerData} onOpenHistory={() => setShowHistory(true)} />
          <PopupSection t={timerData} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
        </motion.div>
      )}
    </div>
  );
}
