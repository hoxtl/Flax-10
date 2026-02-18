import { useRef } from "react";
import styles from "./DateNavigator.module.css";
import { addDays, formatDayLabel, parseDateInput, isSameDay } from "../utils/dateUtils";

function Arrow({ dir, onClick }) {
  return <button className={styles.arrow} onClick={onClick}>{dir === "prev" ? "‹" : "›"}</button>;
}

function TodayBtn({ onClick }) {
  return <button className={styles.today} onClick={onClick}>Today</button>;
}

function HiddenDateInput({ ref, value, onPick }) {
  return <input ref={ref} type="date" className={styles.hiddenInput} value={value} onChange={(e) => onPick(e.target.value)} />;
}

function CalendarButton({ value, onPick }) {
  const ref = useRef(null);
  return (
    <>
      <button className={styles.calBtn} onClick={() => ref.current?.showPicker?.()}>📅</button>
      <HiddenDateInput ref={ref} value={value} onPick={onPick} />
    </>
  );
}

function DateLabel({ date, today, scheduleTitle }) {
  return (
    <div className={styles.center}>
      <div className={styles.title}>{formatDayLabel(date, today)}</div>
      <div className={styles.subtitle}>{scheduleTitle || "Today's schedule"}</div>
    </div>
  );
}

export default function DateNavigator({ date, onChange, scheduleTitle }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (
    <div className={styles.row}>
      <Arrow dir="prev" onClick={() => onChange(addDays(date, -1))} />
      <DateLabel date={date} today={today} scheduleTitle={scheduleTitle} />
      <Arrow dir="next" onClick={() => onChange(addDays(date, 1))} />
      <CalendarButton value={date.toISOString().slice(0, 10)} onPick={(d) => onChange(parseDateInput(d))} />
      {!isSameDay(date, today) && <TodayBtn onClick={() => onChange(today)} />}
    </div>
  );
}