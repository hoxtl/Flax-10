import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import {
  MainSection,
  PopupSection,
} from "../../components/Timer/WrapperComponents";
import WordLoader from "../../components/ui/word-loader";

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

const FOCUS_WORDS = ["focus", "deep work", "lock in", "you've got this"];

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const { permission, request } = useNotificationPermission();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!showFocusTransition) return;
    const id = setTimeout(() => setShowFocusTransition(false), 5000);
    return () => clearTimeout(id);
  }, [showFocusTransition]);

  const fromTaskPlay = Boolean(location.state?.fromTaskPlay);

  return (
    <div className={`${styles.container} ${fromTaskPlay && showFocusTransition ? styles.containerFocusEntering : ""}`}>
      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <WordLoader words={FOCUS_WORDS} className={styles.focusModeTransitionText} />
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
