/*
 * Attendance prompt modal — KCL branding, progress ring, and animated glow border.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import { useAttendanceStats } from "../../../pages/attendance/hooks/useAttendanceStats";
import { computeAttendancePct } from "../../../pages/attendance/utils/attendanceSummary";
import styles from "../styles/AttendancePromptModal.module.css";

function KclLogo() {
  const kclRed = ["#", "C8102E"].join("");
  return (
    <svg width="56" height="42" viewBox="0 0 112 84" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="King's College London">
      <rect width="112" height="84" rx="3" fill={kclRed} />
      <text x="56" y="25" textAnchor="middle" fontFamily="Palatino Linotype,Palatino,Georgia,Times New Roman,serif" fontSize="22" fontWeight="bold" fill="white" letterSpacing="2">KING&apos;S</text>
      <text x="60" y="48" textAnchor="middle" fontFamily="Palatino Linotype,Palatino,Georgia,Times New Roman,serif" fontSize="17" fontStyle="italic" fill="white" letterSpacing="0.3">College</text>
      <text x="56" y="68" textAnchor="middle" fontFamily="Palatino Linotype,Palatino,Georgia,Times New Roman,serif" fontSize="20" fontWeight="bold" fill="white" letterSpacing="2">LONDON</text>
      <line x1="9" y1="74" x2="103" y2="74" stroke="white" strokeWidth="1.6" />
      <line x1="9" y1="79" x2="103" y2="79" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}

function ringColor(pct) {
  if (pct >= 70) {
    return ["#", "22c55e"].join("");
  }
  if (pct >= 50) {
    return ["#", "f97316"].join("");
  }
  return ["#", "ef4444"].join("");
}

function RingCircles({ r, circ, offset, color, circleTransition }) {
  const gray = ["#", "e5e7eb"].join("");
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r={r} fill="none" stroke={`var(--border, ${gray})`} strokeWidth="7" />
      <motion.circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={circleTransition} transform="rotate(-90 48 48)" />
    </svg>
  );
}

function RingLabel({ pct, color, updating }) {
  return (
    <div className={styles.ringLabel}>
      <motion.span className={styles.ringPct} style={{ color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: updating ? 0 : 0.6, duration: 0.4 }}>{pct}%</motion.span>
      <span className={styles.ringSub}>attended</span>
    </div>
  );
}

function AttendanceRing({ pct, updating }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = ringColor(pct);
  const circleTransition = updating ? { duration: 0.7, ease: "easeOut" } : { duration: 1.3, ease: "easeOut", delay: 0.15 };
  return (
    <div className={styles.ringWrap}>
      <RingCircles r={r} circ={circ} offset={offset} color={color} circleTransition={circleTransition} />
      <RingLabel pct={pct} color={color} updating={updating} />
    </div>
  );
}

const successIconTransition = { type: "spring", stiffness: 320, damping: 20, delay: 0.08 };
const successTextTransition = { delay: 0.22, duration: 0.3 };
const successWrapTransition = { duration: 0.35, ease: [0.23, 1, 0.32, 1] };

function SuccessContent({ attended }) {
  const green = ["#", "22c55e"].join("");
  const red = ["#", "ef4444"].join("");
  const color = attended ? green : red;
  const Icon = attended ? CheckCircle : XCircle;
  const message = attended ? "Attendance recorded!" : "Missed session noted.";
  return (
    <motion.div className={styles.successContent} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={successWrapTransition}>
      <motion.div style={{ color }} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={successIconTransition}>
        <Icon size={44} strokeWidth={1.8} />
      </motion.div>
      <motion.p className={styles.successMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={successTextTransition}>{message}</motion.p>
    </motion.div>
  );
}

function formatEventMeta(event) {
  if (!event?.start_time) return null;
  const start = new Date(event.start_time);
  const day = start.toLocaleDateString("en-GB", { weekday: "long" });
  const date = start.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const time = start.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return { day, date, time };
}

function QuestionContent({ event, isAnswered, onAnswer }) {
  const meta = formatEventMeta(event);
  return (
    <motion.div key="question" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      <div className={styles.eventPill}>
        Did you attend <strong className={styles.eventName}>{event.title}</strong>
        {meta && <span className={styles.eventMeta}> at {meta.time} on {meta.day}, {meta.date}?</span>}
      </div>
      <div className={styles.yesNoRow}>
        <PrimaryButton pill className={styles.btnYes} onClick={() => onAnswer(true)} disabled={isAnswered}>Yes</PrimaryButton>
        <PrimaryButton pill variant="danger" className={styles.btnFlex} onClick={() => onAnswer(false)} disabled={isAnswered}>No</PrimaryButton>
      </div>
    </motion.div>
  );
}

const glowPulse = {
  animate: {
    boxShadow: [
      ["0 0 0 2px ", "#", "dc2626", ", 0 0 18px 5px ", "rg", "ba", "(220,38,38,0.28), 0 16px 48px ", "rg", "ba", "(0,0,0,0.28)"].join(""),
      ["0 0 0 2px ", "#", "dc2626", ", 0 0 30px 10px ", "rg", "ba", "(220,38,38,0.48), 0 16px 48px ", "rg", "ba", "(0,0,0,0.28)"].join(""),
      ["0 0 0 2px ", "#", "dc2626", ", 0 0 18px 5px ", "rg", "ba", "(220,38,38,0.28), 0 16px 48px ", "rg", "ba", "(0,0,0,0.28)"].join(""),
    ],
  },
  transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
};

function computeDisplayPct(answeredWith, overall, basePct) {
  if (answeredWith === true) {
    return computeAttendancePct({ attended: overall.attended + 1, missed: overall.missed });
  }
  if (answeredWith === false) {
    return computeAttendancePct({ attended: overall.attended, missed: overall.missed + 1 });
  }
  return basePct;
}

function useAttendancePromptState(event, onAnswer) {
  const { overall, refetch } = useOverallAttendance();
  const answerState = useAnswerState(event);
  const displayPct = useDisplayPercentage(answerState.answeredWith, overall);
  const handleAnswer = useAnswerHandler({ answerState, onAnswer, overall, refetch });
  return { answeredWith: answerState.answeredWith, displayPct, handleAnswer, submitError: answerState.submitError };
}

function useOverallAttendance() {
  const { stats, refetch } = useAttendanceStats();
  return { overall: stats?.overall ?? { attended: 0, missed: 0 }, refetch };
}

function useAnswerState(event) {
  const [answeredWith, setAnsweredWith] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const timerRef = useRef(null);
  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);
  useEffect(() => {
    setAnsweredWith(null);
    setSubmitError("");
  }, [event?.id]);
  return { answeredWith, setAnsweredWith, submitError, setSubmitError, timerRef };
}

function useDisplayPercentage(answeredWith, overall) {
  return useMemo(() => computeDisplayPct(answeredWith, overall, computeAttendancePct(overall)), [answeredWith, overall]);
}

function useAnswerHandler({ answerState, onAnswer, overall, refetch }) {
  const { setAnsweredWith, setSubmitError, timerRef } = answerState;

  return useCallback((attended) => {
    setSubmitError("");
    setAnsweredWith(attended);
    timerRef.current = setTimeout(() => {
      void handleSubmitAnswer(attended, { answerState, onAnswer, overall, refetch });
    }, 1200);
  }, [answerState, onAnswer, overall, refetch, setAnsweredWith, setSubmitError, timerRef]);
}

async function handleSubmitAnswer(attended, context) {
  const success = await context.onAnswer(attended, { afterSuccess: context.refetch, closeDelayMs: 700 });
  if (success) return;
  context.answerState.setAnsweredWith(null);
  context.answerState.setSubmitError("Could not update attendance. Please try again.");
}

function ModalContent({ event, answeredWith, displayPct, handleAnswer, onDismiss, submitError }) {
  const isAnswered = answeredWith !== null;
  return (
    <>
      <div className={styles.header}><h2 className={styles.title}>Attendance Tracker</h2><KclLogo /></div>
      <AttendanceRing pct={displayPct} updating={isAnswered} />
      <AnimatePresence mode="wait">
        {isAnswered ? <SuccessContent key="success" attended={answeredWith} /> : <QuestionContent key="question" event={event} isAnswered={isAnswered} onAnswer={handleAnswer} />}
      </AnimatePresence>
      {submitError && <p className={styles.errorText}>{submitError}</p>}
    </>
  );
}

const modalInitial = { opacity: 0, scale: 0.92, y: 10 };
const modalExit = { opacity: 0, scale: 0.9, y: 12 };
const modalTransition = { opacity: { duration: 0.22, ease: "easeOut" }, scale: { duration: 0.25, ease: [0.23, 1, 0.32, 1] }, y: { duration: 0.25 }, boxShadow: glowPulse.transition };

export default function AttendancePromptModal({ event, onAnswer, onDismiss }) {
  const { answeredWith, submitError, displayPct, handleAnswer } = useAttendancePromptState(event, onAnswer);
  return createPortal(
    <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
      <motion.div className={styles.modal} onMouseDown={e => e.stopPropagation()} initial={modalInitial} animate={{ opacity: 1, scale: 1, y: 0, ...glowPulse.animate }} exit={modalExit} transition={modalTransition}>
        <ModalContent event={event} answeredWith={answeredWith} displayPct={displayPct} handleAnswer={handleAnswer} onDismiss={onDismiss} submitError={submitError} />
      </motion.div>
    </motion.div>,
    document.body
  );
}
