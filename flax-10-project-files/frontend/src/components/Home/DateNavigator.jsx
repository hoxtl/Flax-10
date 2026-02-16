import { useRef } from "react";
import styles from "./DateNavigator.module.css";
import { addDays, formatDayLabel, parseDateInput, isSameDay } from "../utils/dateUtils";

//Component to navigate between dates
function Arrow({ dir, onClick }) {
  return (
    <button className={styles.arrow} onClick={onClick}>
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

// Button to jump back to today's date
function TodayBtn({ onClick }) {
  return (
    <button className={styles.today} onClick={onClick}>
      Today
    </button>
  );
}

// Button that opens the native date picker when clicked, allowing the user to select a date directly
function CalendarButton({ value, onPick }) {
  const ref = useRef(null);
  return (
    <>
      <button
        className={styles.calBtn}
        onClick={() => ref.current?.showPicker?.()}
      >
        🗓️
      </button>
      <input
        ref={ref}
        type="date"
        className={styles.hiddenInput}
        value={value}
        onChange={(e) => onPick(e.target.value)}
      />
    </>
  );
}

//Display current date and allow navigation to previous/next day, as well as quick jump to today or a specific date using the calendar picker
export default function DateNavigator({ date, onChange, scheduleTitle }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const showToday = !isSameDay(date, today);

  return (
    <div className={styles.row}>
      <Arrow dir="prev" onClick={() => onChange(addDays(date, -1))} />
      <div className={styles.center}>
        <div className={styles.title}>{formatDayLabel(date, today)}</div>
        <div className={styles.subtitle}>{scheduleTitle || "Today's schedule"}</div>
      </div>
      <Arrow dir="next" onClick={() => onChange(addDays(date, 1))} />
      <CalendarButton value={date.toISOString().slice(0, 10)} onPick={(d) => onChange(parseDateInput(d))} />
      {showToday && <TodayBtn onClick={() => onChange(today)} />}
    </div>
  );
}


