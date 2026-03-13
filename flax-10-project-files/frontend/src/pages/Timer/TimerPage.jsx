import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TimerPage.module.css";
import { useNotificationPermission } from "../../components/Timer/utils/timerUtils";
import { useTimerContext } from "../../context/TimerContext";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import AppPage from "../../components/common/AppPage/AppPage";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import {
  MainSection,
  PopupSection,
} from "../../components/Timer/WrapperComponents";
import WordLoader from "../../components/ui/word-loader";
import useBreakpoint from "../../hooks/useBreakpoint";

const MIN_FOCUS_SKELETON_MS = 500;

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

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const [showFocusTransition, setShowFocusTransition] = useState(() => Boolean(location.state?.fromTaskPlay));
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);
  const { permission, request } = useNotificationPermission();
  const isMobile = useBreakpoint();

  useEffect(() => {
    if (!showFocusTransition) return;
    const id = setTimeout(() => setShowFocusTransition(false), 5000);
    return () => clearTimeout(id);
  }, [showFocusTransition]);

  useEffect(() => {
    const id = setTimeout(() => setShowPageSkeleton(false), MIN_FOCUS_SKELETON_MS);
    return () => clearTimeout(id);
  }, []);

  const fromTaskPlay = Boolean(location.state?.fromTaskPlay);

  return (
    <AppPage
      width="lg"
      className={`${styles.container} ${fromTaskPlay && showFocusTransition ? styles.containerFocusEntering : ""}`}
    >
      {showPageSkeleton && <FocusPageSkeleton />}
      {showFocusTransition && (
        <div className={styles.focusModeTransition} aria-live="polite">
          <WordLoader words={FOCUS_WORDS} className={styles.focusModeTransitionText} />
        </div>
      )}
      <div
        className={fromTaskPlay ? styles.focusModeContent : undefined}
        style={showPageSkeleton ? { visibility: "hidden" } : undefined}
      >
        <NotificationPrompt permission={permission} request={request} />
        <MainSection t={t} onOpenHistory={() => setShowHistory(true)} isMobile={isMobile} />
        <PopupSection t={t} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
      </div>
    </AppPage>
  );
}
