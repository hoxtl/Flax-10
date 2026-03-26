/**
 * AppTour — one-time onboarding tour for new users.
 * Shows a spotlight overlay with tooltip cards for key nav items.
 * Shown once per user; dismissed state persisted to localStorage.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import styles from "./AppTour.module.css";

const TOUR_STEPS = [
  {
    tourId: null,
    title: "Welcome to StudyFlax",
    description:
      "This quick tour will show you the key features. You can skip at any time.",
    placement: "center",
  },
  {
    tourId: "home",
    title: "Dashboard",
    description:
      "Your home base — see upcoming events, deadlines, and a summary of your activity at a glance.",
    placement: "right",
  },
  {
    tourId: "calendar",
    title: "Calendar",
    description:
      "Plan your week with a full calendar view of lectures, society events, and personal study blocks.",
    placement: "right",
  },
  {
    tourId: "timer",
    title: "Focus Timer",
    description:
      "Start a Pomodoro-style study session. Every session you log unlocks analytics, streaks, and profile insights.",
    placement: "right",
  },
  {
    tourId: "societies",
    title: "Societies",
    description:
      "Browse and join student societies. Your membership feeds into your profile and helps match you with study partners.",
    placement: "right",
  },
  {
    tourId: "analytics",
    title: "Analytics",
    description:
      "Deep-dive into your study patterns, focus habits, and performance trends after you've logged some sessions.",
    placement: "right",
  },
  {
    tourId: "attendance",
    title: "My Venio Details",
    description:
      "Your personal profile — study DNA, streaks, weekly goals, and the heatmap of your focus hours.",
    placement: "right",
  },
];

const PAD = 10;

function useTargetRect(tourId) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!tourId) return;
    function measure() {
      const el = document.querySelector(`[data-tour="${tourId}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    measure();
    const id = setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(id); window.removeEventListener("resize", measure); };
  }, [tourId]);
  return tourId ? rect : null;
}

function useTourActions(step, setStep, onDone) {
  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    onDone?.();
  }, [onDone, step, setStep]);
  const prev = useCallback(() => {
    if (step > 0) setStep((current) => current - 1);
  }, [step, setStep]);
  return { next, prev };
}

function SpotlightOverlay({ rect }) {
  if (!rect) return <div className={styles.overlay} />;
  const { x, y, width, height } = rect;
  const clip = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    0% ${y - PAD}px,
    ${x - PAD}px ${y - PAD}px,
    ${x - PAD}px ${y + height + PAD}px,
    ${x + width + PAD}px ${y + height + PAD}px,
    ${x + width + PAD}px ${y - PAD}px,
    0% ${y - PAD}px
  )`;
  return <div className={styles.overlay} style={{ clipPath: clip }} />;
}

function getCardPosition(rect, placement) {
  if (!rect || placement === "center") return null;
  const { x, y, width, height } = rect;
  return { left: x + width + PAD + 8, top: Math.max(PAD, y + height / 2 - 80) };
}

function getTourCardClassName(rect, placement) {
  return `${styles.card} ${getCardPosition(rect, placement) ? styles.cardPositioned : styles.cardCentered}`;
}

function TourHeader({ stepIndex, total, onSkip }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.stepCount}>{stepIndex + 1} / {total}</span>
      <button className={styles.skipBtn} onClick={onSkip}>Skip tour</button>
    </div>
  );
}

function TourActions({ stepIndex, total, onNext, onPrev }) {
  return (
    <div className={styles.cardActions}>
      {stepIndex > 0 && <button className={styles.prevBtn} onClick={onPrev}>Back</button>}
      <button className={styles.nextBtn} onClick={onNext}>{stepIndex === total - 1 ? "Finish" : "Next"}</button>
    </div>
  );
}

function TourCard({ step, stepIndex, total, onNext, onPrev, onSkip, rect }) {
  const position = getCardPosition(rect, step.placement);
  return (
    <Motion.div
      key={stepIndex}
      className={getTourCardClassName(rect, step.placement)}
      style={position ? { inset: `${position.top}px auto auto ${position.left}px` } : undefined}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <TourHeader stepIndex={stepIndex} total={total} onSkip={onSkip} />
      <h3 className={styles.cardTitle}>{step.title}</h3>
      <p className={styles.cardDescription}>{step.description}</p>
      <TourActions stepIndex={stepIndex} total={total} onNext={onNext} onPrev={onPrev} />
      <ProgressDots total={total} current={stepIndex} />
    </Motion.div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ""}`} />
      ))}
    </div>
  );
}

export default function AppTour({ onDone }) {
  const [step, setStep] = useState(0);
  const currentStep = TOUR_STEPS[step];
  const rect = useTargetRect(currentStep?.tourId);
  const { next, prev } = useTourActions(step, setStep, onDone);

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="App tour">
      <TourFrame step={currentStep} stepIndex={step} rect={rect} onNext={next} onPrev={prev} onSkip={onDone} />
    </div>
  );
}

function TourFrame({ step, stepIndex, rect, onNext, onPrev, onSkip }) {
  return (
    <>
      <Motion.div key={stepIndex} className={styles.overlayWrap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
        <SpotlightOverlay rect={rect} />
      </Motion.div>
      <AnimatePresence mode="wait">
        <TourCard key={stepIndex} step={step} stepIndex={stepIndex} total={TOUR_STEPS.length} onNext={onNext} onPrev={onPrev} onSkip={onSkip} rect={rect} />
      </AnimatePresence>
    </>
  );
}
