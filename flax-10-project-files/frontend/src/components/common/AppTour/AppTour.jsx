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
    description: "Your home base — see upcoming events, deadlines, and a summary of your day at a glance.",
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
      const el = document.querySelector(`[data-tour="${tourId}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    const id = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(id); window.removeEventListener("resize", measure); };
  }, [tourId]);
  return rect;
}
<<<<<<< HEAD

function useTourActions(step, setStep, onDone) {
  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    onDone?.();
  }, [onDone, step, setStep]);
  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step, setStep]);
  return { next, prev };
}

function getCardPosition(rect, placement) {
  if (!rect || placement === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", arrowSide: null };
  }
  const { x, y, width, height } = rect;
  if (y < 120) {
    return {
      top: y + height + PAD + 6,
      left: Math.max(PAD, Math.min(x, window.innerWidth - CARD_W - PAD)),
      arrowSide: "top",
    };
  }
  return {
    top: Math.max(PAD, Math.min(y + height / 2 - 90, window.innerHeight - 300 - PAD)),
    left: x + width + PAD + 8,
    arrowSide: "left",
  };
}

=======
>>>>>>> origin/main
function SpotlightOverlay({ rect }) {
  if (!rect) return <div className={styles.overlay} />;
  const { x, y, width, height } = rect;
  const clip = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${y - PAD}px, ${x - PAD}px ${y - PAD}px, ${x - PAD}px ${y + height + PAD}px, ${x + width + PAD}px ${y + height + PAD}px, ${x + width + PAD}px ${y - PAD}px, 0% ${y - PAD}px)`;
  return <div className={styles.overlay} style={{ clipPath: clip }} />;
}
<<<<<<< HEAD

function SpotlightRing({ rect }) {
  if (!rect) return null;
  const { x, y, width, height } = rect;
  return (
    <Motion.div
      className={styles.spotlightRing}
      style={{ left: x - PAD, top: y - PAD, width: width + PAD * 2, height: height + PAD * 2 }}
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
=======
function getCardPosition(rect, step) {
  if (!rect || step.placement === "center") return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const { x, y, width, height } = rect;
  return { top: Math.max(PAD, y + height / 2 - 80), left: x + width + PAD + 8 };
}
function TourCardHeader({ stepIndex, total, onSkip }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.stepCount}>{stepIndex + 1} / {total}</span>
      <button className={styles.skipBtn} onClick={onSkip}>Skip tour</button>
    </div>
  );
}
function TourCardFooter({ stepIndex, total, onPrev, onNext }) {
  return (
    <>
      <div className={styles.cardActions}>
        {stepIndex > 0 && <button className={styles.prevBtn} onClick={onPrev}>Back</button>}
        <button className={styles.nextBtn} onClick={onNext}>{stepIndex === total - 1 ? "Finish" : "Next"}</button>
      </div>
      <ProgressDots total={total} current={stepIndex} />
    </>
  );
}
function TourCard({ step, stepIndex, total, onNext, onPrev, onSkip, rect }) {
  const pos = getCardPosition(rect, step);
  return (
    <Motion.div
      key={stepIndex} className={styles.card} style={{ ...pos, width: CARD_W }}
      initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }} transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <TourCardHeader stepIndex={stepIndex} total={total} onSkip={onSkip} />
      <h3 className={styles.cardTitle}>{step.title}</h3>
      <p className={styles.cardDescription}>{step.description}</p>
      <TourCardFooter stepIndex={stepIndex} total={total} onPrev={onPrev} onNext={onNext} />
    </Motion.div>
>>>>>>> origin/main
  );
}

function ProgressDots({ total, current, onJump }) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
          onClick={() => onJump?.(i)}
          aria-label={`Go to step ${i + 1}: ${TOUR_STEPS[i]?.title ?? ""}`}
          title={TOUR_STEPS[i]?.title ?? ""}
        />
      ))}
    </div>
  );
}

<<<<<<< HEAD
function TourCard({ step, stepIndex, total, onNext, onPrev, onSkip, onJump, rect }) {
  const isWelcome = step.placement === "center";
  const pos = getCardPosition(rect, step.placement);
  const { arrowSide, ...stylePos } = pos;
  const StepIcon = STEP_ICONS[step.tourId] ?? null;
  const isLast = stepIndex === total - 1;

  const cardClasses = [
    styles.card,
    arrowSide === "left" ? styles.hasArrowLeft : "",
    arrowSide === "top" ? styles.hasArrowTop : "",
  ].filter(Boolean).join(" ");

  return (
    <Motion.div
      key={stepIndex}
      className={cardClasses}
      style={{ ...stylePos, width: isWelcome ? 340 : CARD_W }}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <ProgressBar current={stepIndex} total={total} />

      {isWelcome ? (
        <div className={styles.welcomeInner}>
          <Motion.div
            className={styles.welcomeIconArea}
            animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.1, 1.1, 1.05, 1.05, 1] }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          >
            <span className={styles.welcomeIcon} aria-hidden="true">{step.emoji}</span>
          </Motion.div>
          <h2 className={styles.cardTitle} style={{ fontSize: "1.15rem", textAlign: "center" }}>{step.title}</h2>
          <p className={styles.cardDescription} style={{ textAlign: "center" }}>{step.description}</p>
          <div className={styles.cardActions} style={{ justifyContent: "center" }}>
            <button className={styles.nextBtn} style={{ padding: "0.5rem 2rem" }} onClick={onNext}>
              Start tour
            </button>
          </div>
          <ProgressDots total={total} current={stepIndex} onJump={onJump} />
        </div>
      ) : (
        <div className={styles.stepInner}>
          <div className={styles.cardHeader}>
            <div className={styles.stepHeaderLeft}>
              {StepIcon && (
                <Motion.div
                  className={styles.stepIconBadge}
                  key={stepIndex}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.06 }}
                >
                  <StepIcon size={15} strokeWidth={2} />
                </Motion.div>
              )}
              <span className={styles.stepCount}>{stepIndex} / {total - 1}</span>
            </div>
            <button className={styles.skipBtn} onClick={onSkip}>Skip</button>
          </div>
          <h3 className={styles.cardTitle}>{step.title}</h3>
          <p className={styles.cardDescription}>{step.description}</p>
          <div className={styles.cardFooter}>
            <ProgressDots total={total} current={stepIndex} onJump={onJump} />
            <div className={styles.cardActions}>
              {stepIndex > 0 && <button className={styles.prevBtn} onClick={onPrev}>Back</button>}
              <button className={`${styles.nextBtn}${isLast ? ` ${styles.finishBtn}` : ""}`} onClick={onNext}>
                {isLast ? "Finish" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Motion.div>
  );
}

function TourFrame({ step, stepIndex, rect, onNext, onPrev, onSkip, onJump }) {
  return (
    <>
      <Motion.div
        key={stepIndex}
        className={styles.overlayWrap}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <SpotlightOverlay rect={rect} />
        <AnimatePresence>
          {rect && <SpotlightRing key={`ring-${stepIndex}`} rect={rect} />}
        </AnimatePresence>
      </Motion.div>
      <AnimatePresence mode="wait">
        <TourCard
          key={stepIndex}
          step={step}
          stepIndex={stepIndex}
          total={TOUR_STEPS.length}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onJump={onJump}
          rect={rect}
=======
function useTourNavigation(total, onDone) {
  const [step, setStep] = useState(0);
  const next = useCallback(() => {
    if (step < total - 1) setStep((s) => s + 1);
    else onDone?.();
  }, [step, total, onDone]);
  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);
  return { step, next, prev, currentStep: TOUR_STEPS[step] };
}
function MotionOverlay({ step, rect }) {
  return (
    <Motion.div
      key={step} className={styles.overlayWrap} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
    >
      <SpotlightOverlay rect={rect} />
    </Motion.div>
  );
}
export default function AppTour({ onDone }) {
  const { step, next, prev, currentStep } = useTourNavigation(TOUR_STEPS.length, onDone);
  const rect = useTargetRect(currentStep.tourId);
  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="App tour">
      <MotionOverlay step={step} rect={rect} />
      <AnimatePresence mode="wait">
        <TourCard
          key={step} step={currentStep} stepIndex={step} total={TOUR_STEPS.length}
          onNext={next} onPrev={prev} onSkip={onDone} rect={rect}
>>>>>>> origin/main
        />
      </AnimatePresence>
    </>
  );
}

export default function AppTour({ onDone }) {
  const [step, setStep] = useState(0);
  const currentStep = TOUR_STEPS[step];
  const rect = useTargetRect(currentStep?.tourId);
  const { next, prev } = useTourActions(step, setStep, onDone);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onDone?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onDone]);

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="App tour">
      <TourFrame
        step={currentStep}
        stepIndex={step}
        rect={rect}
        onNext={next}
        onPrev={prev}
        onSkip={onDone}
        onJump={setStep}
      />
    </div>
  );
}
