import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import {
  MainSection,
  PopupSection,
} from "../../components/Timer/WrapperComponents";

function NotificationPrompt({ permission, request }) {
  if (permission !== "default") return null;
  return (
    <button onClick={request} className={styles.notificationBtn}>
      Enable Notifications
    </button>
  );
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

const FOCUS_TRANSITION_MESSAGES = [
  "Entering focus mode...",
  "Getting ready to be productive...",
  "You've got this...",
  "Almost there...",
  "Let's focus...",
];

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const [focusMessageIndex, setFocusMessageIndex] = useState(0);
  const { permission, request } = useNotificationPermission();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!showFocusTransition) return;
    const id = setTimeout(() => setShowFocusTransition(false), 6000);
    return () => clearTimeout(id);
  }, [showFocusTransition]);

  useEffect(() => {
    if (!showFocusTransition) return;
    setFocusMessageIndex(0);
    const interval = setInterval(() => {
      setFocusMessageIndex((i) => (i + 1) % FOCUS_TRANSITION_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [showFocusTransition]);

  const fromTaskPlay = Boolean(location.state?.fromTaskPlay);
  const focusMessage = FOCUS_TRANSITION_MESSAGES[focusMessageIndex];

  return (
    <div className={`${styles.container} ${fromTaskPlay && showFocusTransition ? styles.containerFocusEntering : ""}`}>
      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <p className={styles.focusModeTransitionText} key={focusMessageIndex}>
            {focusMessage}
          </p>
        </div>
      )}
      <div className={fromTaskPlay ? styles.focusModeContent : undefined}>
        <NotificationPrompt permission={permission} request={request} />
        <MainSection t={t} onOpenHistory={() => setShowHistory(true)} isMobile={isMobile} />
        <PopupSection t={t} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
      </div>
    </div>
  );
}
