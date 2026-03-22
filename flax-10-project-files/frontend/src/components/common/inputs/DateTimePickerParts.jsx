/*
 * Sub-components for DateTimePicker: trigger button, calendar grid, and time selector.
 */

import { forwardRef } from "react";
import { Clock } from "lucide-react";
import AnimatedDropdown from "../AnimatedDropdown";
import styles from "./DateTimePicker.module.css";
import { MONTHS, DAYS, HOUR_OPTIONS, MINUTE_OPTIONS, getDisplayValue } from "./dateTimePickerUtils";

export function TriggerButton({ open, setOpen, selDate, timeOnly, dateOnly, placeholder, setSelDate, onChange, triggerClassName, hideIcon }) {
  const displayValue = selDate ? getDisplayValue(selDate, timeOnly, dateOnly) : placeholder;
  const handleClear = (e) => { e.stopPropagation(); setSelDate(null); onChange?.(""); };
  const handleKeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(p => !p); } };
  const cls = [styles.trigger, open ? styles.triggerOpen : "", !selDate ? styles.triggerEmpty : "", triggerClassName || ""].filter(Boolean).join(" ");
  return (
    <div role="button" tabIndex={0} onClick={() => setOpen(p => !p)} onKeyDown={handleKeydown} className={cls}>
      {!hideIcon && <span className={styles.triggerIcon}>{timeOnly ? "🕒" : "📅"}</span>}
      <span className={selDate && !triggerClassName ? styles.triggerValueMono : ""}>{displayValue}</span>
      {selDate && <button type="button" className={styles.clearBtn} onClick={handleClear} aria-label="Clear date">✕</button>}
    </div>
  );
}

function CalendarHeader({ viewM, viewY, prevMonth, nextMonth }) {
  return (
    <div className={styles.calHeader}>
      <button type="button" className={styles.navBtn} onClick={prevMonth}>‹</button>
      <span className={styles.monthLabel}>{MONTHS[viewM]} {viewY}</span>
      <button type="button" className={styles.navBtn} onClick={nextMonth}>›</button>
    </div>
  );
}

function DayCell({ day, index, isToday, isSel, isDisabled, selectDay }) {
  const disabled = !day || isDisabled(day);
  const cls = `${styles.dayCell} ${!day ? styles.dayCellEmpty : ""} ${day && isToday(day) ? styles.dayCellToday : ""} ${day && isSel(day) ? styles.dayCellSel : ""} ${disabled && day ? styles.dayCellDisabled : ""}`;
  return (
    <button key={index} type="button" disabled={disabled} onClick={() => day && selectDay(day)} className={cls}>
      {day || ""}
    </button>
  );
}

export function CalendarSection({ viewM, viewY, prevMonth, nextMonth, days, isToday, isSel, isDisabled, selectDay }) {
  return (
    <>
      <CalendarHeader viewM={viewM} viewY={viewY} prevMonth={prevMonth} nextMonth={nextMonth} />
      <div className={styles.calGrid}>
        {DAYS.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
        {days.map((d, i) => <DayCell key={i} day={d} index={i} isToday={isToday} isSel={isSel} isDisabled={isDisabled} selectDay={selectDay} />)}
      </div>
    </>
  );
}

function TimeDropdown({ value, onChange, options, placeholder }) {
  return (
    <div className={styles.timeDropdown}>
      <AnimatedDropdown value={String(value)} onChange={v => onChange(Number(v))} options={options} placeholder={placeholder} className={styles.timeAnimatedDd} allowFlipUpward usePortal menuMaxHeight={200} />
    </div>
  );
}

export function TimePickerRow({ hour, minute, changeHour, changeMinute, timeOnly, setOpen }) {
  return (
    <div className={`${styles.timePicker} ${timeOnly ? styles.timeOnlyPicker : ""}`}>
      <Clock size={14} strokeWidth={2} className={styles.timeIcon} />
      <TimeDropdown value={hour} onChange={changeHour} options={HOUR_OPTIONS} placeholder="HH" />
      <span className={styles.timeSep}>:</span>
      <TimeDropdown value={minute} onChange={changeMinute} options={MINUTE_OPTIONS} placeholder="MM" />
      <button type="button" className={styles.doneBtn} onClick={() => setOpen(false)}>Done</button>
    </div>
  );
}

export const DropdownPanel = forwardRef(function DropdownPanel({ pos, dateOnly, timeOnly, setOpen, selectDay, ...rest }, ref) {
  const onDaySelect = (day) => { selectDay(day); if (dateOnly) setOpen(false); };
  return (
    <div ref={ref} className={styles.dropdown} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 10000 }}>
      {!timeOnly && <CalendarSection {...rest} selectDay={onDaySelect} />}
      {!dateOnly && <TimePickerRow {...rest} timeOnly={timeOnly} setOpen={setOpen} />}
    </div>
  );
});
