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
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./DateTimePicker.module.css";

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n) { return String(n).padStart(2, "0"); }

function formatDisplay(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
    + "  " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

function calendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time" }) {
  // Parse incoming value
  const parsed = useMemo(() => value ? new Date(value) : null, [value]);

  const [open,    setOpen]    = useState(false);
  const [viewY,   setViewY]   = useState((parsed || new Date()).getFullYear());
  const [viewM,   setViewM]   = useState((parsed || new Date()).getMonth());
  const [selDate, setSelDate] = useState(parsed);
  const [hour,    setHour]    = useState(parsed ? parsed.getHours()   : 12);
  const [minute,  setMinute]  = useState(parsed ? parsed.getMinutes() : 0);

  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Position dropdown when opening (so it's not clipped by modal overflow)
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const gap = 6;
    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownPos({
      top: openAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap,
      left: rect.left,
    });
  }, [open]);

  // Sync selDate/time when value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelDate(d);
      setHour(d.getHours());
      setMinute(d.getMinutes());
      setViewY(d.getFullYear());
      setViewM(d.getMonth());
    } else {
      setSelDate(null);
    }
  }, [value]);

  // Close on outside click (trigger and portaled dropdown are separate)
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const emitChange = (date, h, m) => {
    if (!date) { onChange?.(""); return; }
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    // Return as "YYYY-MM-DDTHH:mm" (compatible with datetime-local input)
    const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    onChange?.(iso);
  };

  const selectDay = (day) => {
    const d = new Date(viewY, viewM, day);
    setSelDate(d);
    emitChange(d, hour, minute);
  };

  const changeHour = (h) => {
    setHour(h);
    if (selDate) emitChange(selDate, h, minute);
  };
  const changeMinute = (m) => {
    setMinute(m);
    if (selDate) emitChange(selDate, hour, m);
  };

  const prevMonth = () => { if (viewM === 0) { setViewY(y=>y-1); setViewM(11); } else setViewM(m=>m-1); };
  const nextMonth = () => { if (viewM === 11) { setViewY(y=>y+1); setViewM(0); } else setViewM(m=>m+1); };

  const days  = calendarDays(viewY, viewM);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
  const isSel   = (d) => selDate && d === selDate.getDate() && viewM === selDate.getMonth() && viewY === selDate.getFullYear();

  return (
    <div className={styles.wrap} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${!selDate ? styles.triggerEmpty : ""}`}
        onClick={() => setOpen(p => !p)}
      >
        <span className={styles.triggerIcon}>📅</span>
        <span className={selDate ? styles.triggerValueMono : ""}>{selDate ? formatDisplay(selDate) : placeholder}</span>
        {selDate && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={e => { e.stopPropagation(); setSelDate(null); onChange?.(""); }}
          >✕</button>
        )}
      </button>

      {/* Dropdown — rendered in portal so it's not clipped by modal */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 10000,
          }}
        >
          {/* Month navigation */}
          <div className={styles.calHeader}>
            <button type="button" className={styles.navBtn} onClick={prevMonth}>‹</button>
            <span className={styles.monthLabel}>{MONTHS[viewM]} {viewY}</span>
            <button type="button" className={styles.navBtn} onClick={nextMonth}>›</button>
          </div>

          {/* Day-of-week headers */}
          <div className={styles.calGrid}>
            {DAYS.map(d => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dayCell}
                  ${!d ? styles.dayCellEmpty : ""}
                  ${d && isToday(d) ? styles.dayCellToday : ""}
                  ${d && isSel(d)   ? styles.dayCellSel   : ""}`}
                onClick={() => d && selectDay(d)}
                disabled={!d}
              >
                {d || ""}
              </button>
            ))}
          </div>

          {/* Time pickers */}
          <div className={styles.timePicker}>
            <span className={styles.timeIcon}>🕐</span>
            <select
              className={styles.timeSelect}
              value={hour}
              onChange={e => changeHour(Number(e.target.value))}
            >
              {Array.from({length:24}, (_,i) => (
                <option key={i} value={i}>{pad(i)}</option>
              ))}
            </select>
            <span className={styles.timeSep}>:</span>
            <select
              className={styles.timeSelect}
              value={minute}
              onChange={e => changeMinute(Number(e.target.value))}
            >
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}