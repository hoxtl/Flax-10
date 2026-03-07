/**
 * Date/time picker: trigger button and dropdown (calendar + time).
 * Uses useDateTimePicker and utils for logic; subcomponents for UI.
 */

import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import useDateTimePicker from "../hooks/useDateTimePicker";
import { pad, formatDisplay } from "../utils/dateTimePickerUtils";
import styles from "./DateTimePicker.module.css";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }));
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({ value: String(m), label: pad(m) }));

function DateTimePickerTrigger({ open, setOpen, selDate, timeOnly, placeholder, clearSelection, styles: s }) {
  return (
    <button type="button" className={`${s.trigger} ${open ? s.triggerOpen : ""} ${!selDate ? s.triggerEmpty : ""}`} onClick={() => setOpen((p) => !p)}>
      <span className={s.triggerIcon}>{timeOnly ? "🕒" : "📅"}</span>
      <span className={selDate ? s.triggerValueMono : ""}>
        {selDate ? (timeOnly ? `${pad(selDate.getHours())}:${pad(selDate.getMinutes())}` : formatDisplay(selDate)) : placeholder}
      </span>
      {selDate && <button type="button" className={s.clearBtn} onClick={(e) => { e.stopPropagation(); clearSelection(); }}>✕</button>}
    </button>
  );
}

function DateTimePickerCalendar({ viewM, viewY, prevMonth, nextMonth, days, isToday, isSel, selectDay, styles: s }) {
  return (
    <>
      <div className={s.calHeader}>
        <button type="button" className={s.navBtn} onClick={prevMonth}>‹</button>
        <span className={s.monthLabel}>{MONTHS[viewM]} {viewY}</span>
        <button type="button" className={s.navBtn} onClick={nextMonth}>›</button>
      </div>
      <div className={s.calGrid}>
        {DAYS.map((d) => <div key={d} className={s.dayHeader}>{d}</div>)}
        {days.map((d, i) => (
          <button key={i} type="button" className={`${s.dayCell} ${!d ? s.dayCellEmpty : ""} ${d && isToday(d) ? s.dayCellToday : ""} ${d && isSel(d) ? s.dayCellSel : ""}`} onClick={() => d && selectDay(d)} disabled={!d}>{d || ""}</button>
        ))}
      </div>
    </>
  );
}

function DateTimePickerTime({ hour, minute, changeHour, changeMinute, setOpen, timeOnly, styles: s }) {
  return (
    <div className={`${s.timePicker} ${timeOnly ? s.timeOnlyPicker : ""}`}>
      <Clock size={14} strokeWidth={2} className={s.timeIcon} />
      <div className={s.timeDropdown}>
        <AnimatedDropdown value={String(hour)} onChange={(v) => changeHour(Number(v))} options={HOUR_OPTIONS} placeholder="HH" className={s.timeAnimatedDd} />
      </div>
      <span className={s.timeSep}>:</span>
      <div className={s.timeDropdown}>
        <AnimatedDropdown value={String(minute)} onChange={(v) => changeMinute(Number(v))} options={MINUTE_OPTIONS} placeholder="MM" className={s.timeAnimatedDd} />
      </div>
      <button type="button" className={s.doneBtn} onClick={() => setOpen(false)}>Done</button>
    </div>
  );
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", timeOnly = false }) {
  const picker = useDateTimePicker(value, onChange, timeOnly);
  return (
    <div className={styles.wrap} ref={picker.ref}>
      <DateTimePickerTrigger open={picker.open} setOpen={picker.setOpen} selDate={picker.selDate} timeOnly={picker.timeOnly} placeholder={placeholder} clearSelection={picker.clearSelection} styles={styles} />
      {picker.open && createPortal(
        <div ref={picker.dropdownRef} className={styles.dropdown} style={{ position: "fixed", top: picker.dropdownPos.top, left: picker.dropdownPos.left, zIndex: 10000 }}>
          {!picker.timeOnly && <DateTimePickerCalendar viewM={picker.viewM} viewY={picker.viewY} prevMonth={picker.prevMonth} nextMonth={picker.nextMonth} days={picker.days} isToday={picker.isToday} isSel={picker.isSel} selectDay={picker.selectDay} styles={styles} />}
          <DateTimePickerTime hour={picker.hour} minute={picker.minute} changeHour={picker.changeHour} changeMinute={picker.changeMinute} setOpen={picker.setOpen} timeOnly={picker.timeOnly} styles={styles} />
        </div>,
        document.body
      )}
    </div>
  );
}
