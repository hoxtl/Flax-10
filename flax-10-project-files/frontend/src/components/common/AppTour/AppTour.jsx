/*
 * Guided tour overlay for the main StudyFlax pages.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Home, Calendar, Clock, Users, BarChart2, ClipboardCheck } from "lucide-react";
import styles from "./AppTour.module.css";

const TOUR_STEPS = [
  {
    tourId: null,
    title: "Welcome to StudyFlax",
    description: "This quick tour shows you the key features. You can skip at any time.",
    placement: "center",
    emoji: "✨",
  },
  {
    tourId: "home",
    title: "Dashboard",
    description: "Your home base - see upcoming events, deadlines, and a summary of your day at a glance.",
    placement: "right",
  },
  {
    tourId: "calendar",
    title: "Calendar",
    description: "Plan your week with a full calendar view of lectures, society events, and personal study blocks.",
    placement: "right",
  },
  {
    tourId: "timer",
    title: "Focus Timer",
    description: "Start a Pomodoro-style study session. Every session you log unlocks analytics, streaks, and profile insights.",
    placement: "right",
  },
  {
    tourId: "societies",
    title: "Societies",
    description: "Browse and join student societies. Your membership feeds into your profile and helps match you with study partners.",
    placement: "right",
  },
  {
    tourId: "analytics",
    title: "Analytics",
    description: "Deep-dive into your study patterns, focus habits, and performance trends after you've logged some sessions.",
    placement: "right",
  },
  {
    tourId: "attendance",
    title: "My Venio Details",
    description: "Your attendance record, study DNA, streaks, weekly goals, and the heatmap of your focus hours.",
    placement: "right",
  },
];

const STEP_ICONS = {
  home: Home,
  calendar: Calendar,
  timer: Clock,
  societies: Users,
  analytics: BarChart2,
  attendance: ClipboardCheck,
};

const PAD = 12;
const CARD_W = 310;

function useTargetRect(tourId) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!tourId) return setRect(null);
    const measure = () => {
      const element = document.querySelector(`[data-tour="${tourId}"]`);
      if (element) setRect(element.getBoundingClientRect());
    };
    measure();
    const timeoutId = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measure);
    };
  }, [tourId]);

  return rect;
}

function useTourActions(step, setStep, onDone) {
  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    onDone?.();
  }, [onDone, setStep, step]);

  const prev = useCallback(() => {
    if (step > 0) setStep((current) => current - 1);
  }, [setStep, step]);

  return { next, prev };
}

function useTourKeyboardNavigation(next, prev, onDone) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "ArrowRight" || event.key === "Enter") next();
      else if (event.key === "ArrowLeft") prev();
      else if (event.key === "Escape") onDone?.();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onDone, prev]);
}

function getCardPosition(rect, placement) {
  if (!rect || placement === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", arrowSide: null };
  }

  const { x, y, width, height } = rect;
  if (y < 120) return getTopCardPosition(x, y, height);
  return getSideCardPosition(x, y, width, height);
}

function getTopCardPosition(x, y, height) {
  return {
    top: y + height + PAD + 6,
    left: Math.max(PAD, Math.min(x, window.innerWidth - CARD_W - PAD)),
    arrowSide: "top",
  };
}

function getSideCardPosition(x, y, width, height) {
  return {
    top: Math.max(PAD, Math.min(y + height / 2 - 90, window.innerHeight - 300 - PAD)),
    left: x + width + PAD + 8,
    arrowSide: "left",
  };
}

function buildCardClasses(arrowSide) {
  return [
    styles.card,
    arrowSide === "left" ? styles.hasArrowLeft : "",
    arrowSide === "top" ? styles.hasArrowTop : "",
  ].filter(Boolean).join(" ");
}

function getOverlayStyle(clipPath) {
  return { clipPath };
}

function getSpotlightRingStyle(rect) {
  const { x, y, width, height } = rect;
  return { left: x - PAD, top: y - PAD, width: width + PAD * 2, height: height + PAD * 2 };
}

function getTourCardStyle(stylePos, isWelcome) {
  return { ...stylePos, width: isWelcome ? 340 : CARD_W };
}

function SpotlightOverlay({ rect }) {
  if (!rect) return <div className={styles.overlay} />;

  const { x, y, width, height } = rect;
  const clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${y - PAD}px, ${x - PAD}px ${y - PAD}px, ${x - PAD}px ${y + height + PAD}px, ${x + width + PAD}px ${y + height + PAD}px, ${x + width + PAD}px ${y - PAD}px, 0% ${y - PAD}px)`;
  return <div className={styles.overlay} style={getOverlayStyle(clipPath)} />;
}

function SpotlightRing({ rect }) {
  return (
    <Motion.div
      className={styles.spotlightRing}
      style={getSpotlightRingStyle(rect)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className={styles.progressTrack}>
      <Motion.div
        className={styles.progressFill}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function ProgressDots({ total, current, onJump }) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          className={`${styles.dot} ${index === current ? styles.dotActive : ""}`}
          onClick={() => onJump?.(index)}
          aria-label={`Go to step ${index + 1}: ${TOUR_STEPS[index].title}`}
          title={TOUR_STEPS[index].title}
        />
      ))}
    </div>
  );
}

function buildTourCardContent({ isWelcome, step, stepIndex, total, onJump, onNext, onPrev, onSkip }) {
  if (isWelcome) return <WelcomeTourContent step={step} stepIndex={stepIndex} total={total} onNext={onNext} onJump={onJump} />;
  return <GuidedTourContent step={step} stepIndex={stepIndex} total={total} onJump={onJump} onNext={onNext} onPrev={onPrev} onSkip={onSkip} />;
}

function TourCard({ step, stepIndex, total, onNext, onPrev, onSkip, onJump, rect }) {
  const isWelcome = step.placement === "center";
  const { arrowSide, ...stylePos } = getCardPosition(rect, step.placement);
  const content = buildTourCardContent({ isWelcome, step, stepIndex, total, onJump, onNext, onPrev, onSkip });
  return <TourCardShell stepIndex={stepIndex} isWelcome={isWelcome} stylePos={stylePos} arrowSide={arrowSide}>{content}</TourCardShell>;
}

function TourCardShell({ stepIndex, isWelcome, stylePos, arrowSide, children }) {
  return (
    <Motion.div
      key={stepIndex}
      className={buildCardClasses(arrowSide)}
      style={getTourCardStyle(stylePos, isWelcome)}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <ProgressBar current={stepIndex} total={TOUR_STEPS.length} />
      {children}
    </Motion.div>
  );
}

function WelcomeTourContent({ step, stepIndex, total, onNext, onJump }) {
  return (
    <div className={styles.welcomeInner}>
      <Motion.div
        className={styles.welcomeIconArea}
        animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.1, 1.1, 1.05, 1.05, 1] }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
      >
        <span className={styles.welcomeIcon} aria-hidden="true">{step.emoji}</span>
      </Motion.div>
      <h2 className={`${styles.cardTitle} ${styles.welcomeTitle}`}>{step.title}</h2>
      <p className={`${styles.cardDescription} ${styles.welcomeDescription}`}>{step.description}</p>
      <span className={styles.stepCount}>{stepIndex + 1} / {total}</span>
      <div className={`${styles.cardActions} ${styles.cardActionsCentered}`}>
        <button className={`${styles.nextBtn} ${styles.welcomeStartBtn}`} onClick={onNext}>Next</button>
      </div>
      <ProgressDots total={total} current={stepIndex} onJump={onJump} />
    </div>
  );
}

function GuidedTourContent({ step, stepIndex, total, onJump, onNext, onPrev, onSkip }) {
  const StepIcon = STEP_ICONS[step.tourId];
  return (
    <div className={styles.stepInner}>
      <GuidedTourHeader StepIcon={StepIcon} stepIndex={stepIndex} total={total} onSkip={onSkip} />
      <h3 className={styles.cardTitle}>{step.title}</h3>
      <p className={styles.cardDescription}>{step.description}</p>
      <GuidedTourFooter stepIndex={stepIndex} total={total} onJump={onJump} onNext={onNext} onPrev={onPrev} />
    </div>
  );
}

function GuidedTourHeader({ StepIcon, stepIndex, total, onSkip }) {
  return (
    <div className={styles.cardHeader}>
      <div className={styles.stepHeaderLeft}>
        <StepBadge StepIcon={StepIcon} stepIndex={stepIndex} />
        <span className={styles.stepCount}>{stepIndex + 1} / {total}</span>
      </div>
      <button className={styles.skipBtn} onClick={onSkip}>Skip tour</button>
    </div>
  );
}

function StepBadge({ StepIcon, stepIndex }) {
  return (
    <Motion.div
      className={styles.stepIconBadge}
      key={stepIndex}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.06 }}
    >
      <StepIcon size={15} strokeWidth={2} />
    </Motion.div>
  );
}

function GuidedTourFooter({ stepIndex, total, onJump, onNext, onPrev }) {
  const isLast = stepIndex === total - 1;
  return (
    <div className={styles.cardFooter}>
      <ProgressDots total={total} current={stepIndex} onJump={onJump} />
      <div className={styles.cardActions}>
        <button className={styles.prevBtn} onClick={onPrev}>Back</button>
        <button className={`${styles.nextBtn}${isLast ? ` ${styles.finishBtn}` : ""}`} onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

function TourOverlay({ rect, stepIndex }) {
  return (
    <Motion.div
      key={stepIndex}
      className={styles.overlayWrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <SpotlightOverlay rect={rect} />
      <AnimatePresence>{rect ? <SpotlightRing key={`ring-${stepIndex}`} rect={rect} /> : null}</AnimatePresence>
    </Motion.div>
  );
}

function TourCardLayer(props) {
  return (
    <AnimatePresence mode="wait">
      <TourCard key={props.stepIndex} {...props} total={TOUR_STEPS.length} />
    </AnimatePresence>
  );
}

function TourFrame(props) {
  return (
    <>
      <TourOverlay rect={props.rect} stepIndex={props.stepIndex} />
      <TourCardLayer {...props} />
    </>
  );
}

/** Interactive onboarding tour for the app's main areas. */
export default function AppTour({ onDone }) {
  const [step, setStep] = useState(0);
  const currentStep = TOUR_STEPS[step];
  const rect = useTargetRect(currentStep?.tourId);
  const { next, prev } = useTourActions(step, setStep, onDone);
  useTourKeyboardNavigation(next, prev, onDone);
  return <div className={styles.root} role="dialog" aria-modal="true" aria-label="App tour"><TourFrame step={currentStep} stepIndex={step} rect={rect} onNext={next} onPrev={prev} onSkip={onDone} onJump={setStep} /></div>;
}
