/**
 * DateTimePicker.jsx
 *
 * A minimal, self-contained date + time picker.
 * No external UI libraries required — uses native inputs and a lightweight
 * calendar rendered with vanilla JS date math.
 *
 * Usage:
 *   import DateTimePicker from "./DateTimePicker";
 *
 *   <DateTimePicker
 *     value={dateISOString}         // e.g. "2026-03-15T14:00"
 *     onChange={isoStr => ...}      // called with ISO datetime string or ""
 *     placeholder="Pick date & time"
 *   />
 *
 * Dependencies: none (pure React + CSS modules)
 */
import { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import AnimatedDropdown from "../AnimatedDropdown";
import styles from "./DateTimePicker.module.css";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n) { return String(n).padStart(2, "0"); }

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: pad(i) }));

function formatDisplay(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + "  " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

function formatDateOnly(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getDisplayValue(date, timeOnly, dateOnly) {
  if (timeOnly) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (dateOnly) return formatDateOnly(date);
  return formatDisplay(date);
}

function calendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function parseIncomingValue(value, timeOnly, dateOnly) {
  if (!value) return null;
  if (timeOnly && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(value);
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", timeOnly = false, dateOnly = false, customTrigger = null, triggerClassName, hideIcon }) {
  const parsed = useMemo(() => parseIncomingValue(value, timeOnly, dateOnly), [value, timeOnly, dateOnly]);

  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState((parsed || new Date()).getFullYear());
  const [viewM, setViewM] = useState((parsed || new Date()).getMonth());
  const [selDate, setSelDate] = useState(parsed);
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 12);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);

  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useDropdownPosition(open, ref, timeOnly, dateOnly, setDropdownPos);
  useSyncValue(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM);
  useClickOutside(open, ref, dropdownRef, setOpen);

  const emitChange = (date, h, m) => emitDateTimeChange(date, h, m, timeOnly, dateOnly, onChange);
  const selectDay = (day) => handleDaySelect(day, viewY, viewM, setSelDate, emitChange, hour, minute);
  const changeHour = (h) => handleHourChange(h, setHour, selDate, emitChange, minute);
  const changeMinute = (m) => handleMinuteChange(m, setMinute, selDate, emitChange, hour);
  const prevMonth = () => navigateMonth(-1, viewM, setViewM, setViewY);
  const nextMonth = () => navigateMonth(1, viewM, setViewM, setViewY);

  const days = calendarDays(viewY, viewM);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
  const isSel = (d) => selDate && d === selDate.getDate() && viewM === selDate.getMonth() && viewY === selDate.getFullYear();

  return (
    <div className={styles.wrap} ref={ref}>
      {
        customTrigger ? (
          <div onClick={() => setOpen(p => !p)} style={{ cursor: "pointer" }}>
            {customTrigger}
          </div>
        ) : (
          <TriggerButton open={open} setOpen={setOpen} selDate={selDate} timeOnly={timeOnly} dateOnly={dateOnly}
            placeholder={placeholder} setSelDate={setSelDate} onChange={onChange} triggerClassName={triggerClassName} hideIcon={hideIcon} />
        )
      }
      {
        open && createPortal(
          <DropdownPanel ref={dropdownRef} pos={dropdownPos} timeOnly={timeOnly} dateOnly={dateOnly} viewM={viewM} viewY={viewY}
            prevMonth={prevMonth} nextMonth={nextMonth} days={days} isToday={isToday} isSel={isSel}
            selectDay={selectDay} hour={hour} minute={minute} changeHour={changeHour}
            changeMinute={changeMinute} setOpen={setOpen} />,
          document.body
        )
      }
    </div >
  );
}

function TriggerButton({ open, setOpen, selDate, timeOnly, dateOnly, placeholder, setSelDate, onChange, triggerClassName, hideIcon }) {
  const displayValue = selDate
    ? getDisplayValue(selDate, timeOnly, dateOnly)
    : placeholder;

  const handleClear = (e) => { e.stopPropagation(); setSelDate(null); onChange?.(""); };
  const handleKeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(p => !p); } };

  return (
    <button type="button" onClick={() => setOpen(p => !p)}
      className={triggerClassName || `${styles.trigger} ${open ? styles.triggerOpen : ""} ${!selDate ? styles.triggerEmpty : ""}`}>
      {!hideIcon && <span className={styles.triggerIcon}>{timeOnly ? "🕒" : "📅"}</span>}
      <span className={selDate && !triggerClassName ? styles.triggerValueMono : ""}>{displayValue}</span>
      {selDate && <button type="button" className={styles.clearBtn} onClick={handleClear}>✕</button>}
    </button>
  );
}

const DropdownPanel = forwardRef(function DropdownPanel({ pos, timeOnly, dateOnly, viewM, viewY, prevMonth, nextMonth, days, isToday, isSel,
  selectDay, hour, minute, changeHour, changeMinute, setOpen }, ref) {
  const handleDaySelect = (day) => { selectDay(day); if (dateOnly) setOpen(false); };
  return (
    <div ref={ref} className={styles.dropdown} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 10000 }}>
      {!timeOnly && <CalendarSection viewM={viewM} viewY={viewY} prevMonth={prevMonth}
        nextMonth={nextMonth} days={days} isToday={isToday} isSel={isSel} selectDay={handleDaySelect} />}
      {!dateOnly && <TimePickerRow hour={hour} minute={minute} changeHour={changeHour}
        changeMinute={changeMinute} timeOnly={timeOnly} setOpen={setOpen} />}
    </div>
  );
});

function CalendarHeader({ viewM, viewY, prevMonth, nextMonth }) {
  return (
    <div className={styles.calHeader}>
      <button type="button" className={styles.navBtn} onClick={prevMonth}>‹</button>
      <span className={styles.monthLabel}>{MONTHS[viewM]} {viewY}</span>
      <button type="button" className={styles.navBtn} onClick={nextMonth}>›</button>
    </div>
  );
}

function DayCell({ day, index, isToday, isSel, selectDay }) {
  const cls = `${styles.dayCell} ${!day ? styles.dayCellEmpty : ""} ${day && isToday(day) ? styles.dayCellToday : ""} ${day && isSel(day) ? styles.dayCellSel : ""}`;
  return <button key={index} type="button" disabled={!day} onClick={() => day && selectDay(day)} className={cls}>{day || ""}</button>;
}

function CalendarSection({ viewM, viewY, prevMonth, nextMonth, days, isToday, isSel, selectDay }) {
  return (
    <>
      <CalendarHeader viewM={viewM} viewY={viewY} prevMonth={prevMonth} nextMonth={nextMonth} />
      <div className={styles.calGrid}>
        {DAYS.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
        {days.map((d, i) => <DayCell key={i} day={d} index={i} isToday={isToday} isSel={isSel} selectDay={selectDay} />)}
      </div>
    </>
  );
}

function TimePickerRow({ hour, minute, changeHour, changeMinute, timeOnly, setOpen }) {
  return (
    <div className={`${styles.timePicker} ${timeOnly ? styles.timeOnlyPicker : ""}`}>
      <Clock size={14} strokeWidth={2} className={styles.timeIcon} />
      <div className={styles.timeDropdown}>
        <AnimatedDropdown value={String(hour)} onChange={v => changeHour(Number(v))}
          options={HOUR_OPTIONS} placeholder="HH" className={styles.timeAnimatedDd}
          allowFlipUpward usePortal menuMaxHeight={200} />
      </div>
      <span className={styles.timeSep}>:</span>
      <div className={styles.timeDropdown}>
        <AnimatedDropdown value={String(minute)} onChange={v => changeMinute(Number(v))}
          options={MINUTE_OPTIONS} placeholder="MM" className={styles.timeAnimatedDd}
          allowFlipUpward usePortal menuMaxHeight={200} />
      </div>
      <button type="button" className={styles.doneBtn} onClick={() => setOpen(false)}>Done</button>
    </div>
  );
}

function useDropdownPosition(open, ref, timeOnly, dateOnly, setDropdownPos) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const gap = 6;
    const dropdownHeight = getDropdownHeight(timeOnly, dateOnly);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownPos({ top: openAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap, left: rect.left });
  }, [open, timeOnly, dateOnly, ref, setDropdownPos]);
}

function getDropdownHeight(timeOnly, dateOnly) {
  if (timeOnly) return 130;
  if (dateOnly) return 280;
  return 320;
}

function useSyncValue(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM) {
  useEffect(() => {
    if (!value) { setSelDate(null); return; }
    const d = parseIncomingValue(value, timeOnly, dateOnly);
    if (!d || Number.isNaN(d.getTime())) return;
    setSelDate(d); setHour(d.getHours()); setMinute(d.getMinutes());
    setViewY(d.getFullYear()); setViewM(d.getMonth());
  }, [value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM]);
}

function isInsidePortaledDropdown(target) {
  return target.closest('[data-dropdown-portal="true"]') !== null;
}

function useClickOutside(open, ref, dropdownRef, setOpen) {
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (ref.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      if (isInsidePortaledDropdown(e.target)) return;
      setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", handleOutside, true);
    document.addEventListener("keydown", handleEsc);
    return () => { document.removeEventListener("pointerdown", handleOutside, true); document.removeEventListener("keydown", handleEsc); };
  }, [open, ref, dropdownRef, setOpen]);
}

function emitDateTimeChange(date, h, m, timeOnly, dateOnly, onChange) {
  if (!date) { onChange?.(""); return; }
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  if (timeOnly) { onChange?.(`${pad(d.getHours())}:${pad(d.getMinutes())}`); return; }
  if (dateOnly) { onChange?.(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); return; }
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  onChange?.(iso);
}

function handleDaySelect(day, viewY, viewM, setSelDate, emitChange, hour, minute) {
  const d = new Date(viewY, viewM, day);
  setSelDate(d);
  emitChange(d, hour, minute);
}

function handleHourChange(h, setHour, selDate, emitChange, minute) {
  setHour(h);
  if (selDate) emitChange(selDate, h, minute);
}

function handleMinuteChange(m, setMinute, selDate, emitChange, hour) {
  setMinute(m);
  if (selDate) emitChange(selDate, hour, m);
}

function navigateMonth(dir, viewM, setViewM, setViewY) {
  if (dir === -1) { if (viewM === 0) { setViewY(y => y - 1); setViewM(11); } else setViewM(m => m - 1); }
  else { if (viewM === 11) { setViewY(y => y + 1); setViewM(0); } else setViewM(m => m + 1); }
}
