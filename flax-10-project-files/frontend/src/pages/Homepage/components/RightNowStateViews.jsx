import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Sun } from "lucide-react";
import styles from "./RightNowWidget.module.css";
import { fadeIn, fadeIn as simpleFadeIn } from "./RightNowSubComponents";
import { formatTime } from "../utils/dateFormatUtils";

export const TimerView = ({ timerMode, timerTask, timeLeft, workTime, breakTime, onOpenTimer }) => {
  const isBreak = timerMode === "break";
  const totalSecs = (isBreak ? breakTime || 5 : workTime || 25) * 60;
  const pct = Math.max(0, Math.min(100, ((totalSecs - Math.max(0, timeLeft)) / totalSecs) * 100));
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div className={styles.timerBlock} {...fadeIn(0.07)}>
      <p className={styles.timerLabel}>
        {isBreak ? "BREAK" : "FOCUS"} · {timerTask || (isBreak ? "Break time" : "Focus session")} · {fmt(timeLeft)} left
      </p>
      <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
      <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>Open timer →</button>
    </motion.div>
  );
};

export const NonTodayView = ({ firstEv }) => (
  <motion.div {...fadeIn(0.07)}>
    {firstEv ? <NextEventDetails event={firstEv} /> : <p className={styles.nowEmpty}>No events for this day.</p>}
  </motion.div>
);

const NextEventDetails = ({ event }) => (
  <>
    <p className={styles.upNextTitle}>{event.title}</p>
    {event.start_time && <p className={styles.upNextDetails}>{formatTime(event.start_time)}</p>}
  </>
);

export const EndOfDayView = ({ completedCount, tasksLength, eventsToday, tomorrowEvent, tomorrowTime }) => (
  <motion.div className={styles.endOfDayWrap} {...fadeIn(0.07)}>
    <EndOfDayHeader completedCount={completedCount} tasksLength={tasksLength} eventsToday={eventsToday} />
    {tomorrowEvent && <TomorrowSection event={tomorrowEvent} time={tomorrowTime} />}
  </motion.div>
);

const EndOfDayHeader = ({ completedCount, tasksLength, eventsToday }) => (
  <div className={styles.endOfDayTopRow}>
    <SparkleIcon />
    <div>
      <p className={styles.endOfDayTitle}>Day complete — nice work!</p>
      <EndOfDayStats completed={completedCount} total={tasksLength} events={eventsToday} />
    </div>
  </div>
);

const SparkleIcon = () => (
  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
    <Sparkles size={26} strokeWidth={1.25} color="var(--color-highlight)" aria-hidden />
  </motion.div>
);

const EndOfDayStats = ({ completed, total, events }) => (
  <p className={styles.endOfDaySub}>
    {completed > 0 && `${completed}/${total} tasks done`}
    {completed > 0 && events > 0 && " · "}
    {events > 0 && `${events} event${events !== 1 ? "s" : ""} attended`}
  </p>
);

const TomorrowSection = ({ event, time }) => (
  <>
    <div className={styles.sectionDivider} />
    <div className={styles.tomorrowSection}>
      <p className={styles.tomorrowLabel}>TOMORROW</p>
      <p className={styles.tomorrowFirstTitle}>{event.title}</p>
      {time && <p className={styles.tomorrowFirstTime}>starts at <strong>{time}</strong></p>}
    </div>
  </>
);

export const EmptyDayView = ({ nextDeadline, freeHours, tomorrowFirstEvent, tomorrowTime }) => (
  <motion.div className={styles.emptyDay} {...fadeIn(0.07)}>
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <Sun size={30} strokeWidth={1.25} color="var(--color-highlight)" aria-hidden />
    </motion.div>
    <p className={styles.emptyDayTitle}>Nothing planned today</p>
    {nextDeadline ? <SuggestionBlock deadline={nextDeadline} hours={freeHours} /> : <IdleSubtitle hours={freeHours} />}
    {tomorrowFirstEvent && <TomorrowSummary title={tomorrowFirstEvent.title} time={tomorrowTime} />}
  </motion.div>
);

const SuggestionBlock = ({ deadline, hours }) => (
  <div className={styles.suggestionBlock}>
    <p className={styles.suggestionText}>Next deadline: <strong>{deadline.assessment_title || deadline.title}</strong></p>
    <p className={styles.suggestionSub}>Why not use your <strong>{hours}h free</strong> to get ahead?</p>
  </div>
);

const IdleSubtitle = ({ hours }) => (
  <p className={styles.emptyDaySubtitle}>You have <strong>{hours}h free</strong> today — enjoy it or plan a session!</p>
);

const TomorrowSummary = ({ title, time }) => (
  <p className={styles.emptyDayTomorrow}>Tomorrow: {title} at {time}</p>
);
