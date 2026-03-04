import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import {
  MainSection,
  PopupSection,
} from "../../components/Timer/WrapperComponents";

const FOCUS_MODE_TRANSITION_MS = 1400;
const ZOOM_IN_DURATION_MS = 450;

function NotificationPrompt({ permission, request }) {
  if (permission !== "default") return null;
  return (
    <button onClick={request} className={styles.notificationBtn}>
      Enable Notifications
    </button>
  );
}

export default function TimerPage() {
  const location = useLocation();
  const timerData = useTimerContext();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(false);
  const [showZoomIn, setShowZoomIn] = useState(false);
  const transitionTaskTitle = useRef(null);
  const { permission, request } = useNotificationPermission();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When arriving from Tasks page "Play" button: set task and show "Entering focus mode" then reveal timer with zoom-in
  useEffect(() => {
    const state = location.state;
    if (state?.fromTaskPlay && state?.taskTitle != null) {
      timerData.setTask(state.taskTitle);
      if (timerData.setActiveTaskId && state?.taskId != null) {
        timerData.setActiveTaskId(state.taskId, { title: state.taskTitle });
      }
      transitionTaskTitle.current = state.taskTitle;
      setShowFocusTransition(true);
      const t = setTimeout(() => {
        setShowFocusTransition(false);
        setShowZoomIn(true);
        setTimeout(() => setShowZoomIn(false), ZOOM_IN_DURATION_MS);
      }, FOCUS_MODE_TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  return (
    <div className={styles.container}>
      <NotificationPrompt permission={permission} request={request} />

      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <p className={styles.focusModeTransitionText}>
            Entering focus mode
            <span className={styles.focusModeTransitionDot}>...</span>
          </p>
          {transitionTaskTitle.current && (
            <p className={styles.focusModeTransitionTask}>
              {transitionTaskTitle.current}
            </p>
          )}
        </div>
      )}

      <div className={`${styles.mainContentWrap} ${showZoomIn ? styles.zoomIn : ""}`}>
        <MainSection
          t={timerData}
          onOpenHistory={() => setShowHistory(true)}
          isMobile={isMobile}
        />
        <PopupSection
          t={timerData}
          showHistory={showHistory}
          onCloseHistory={() => setShowHistory(false)}
        />
      </div>
    </div>
  );
}
