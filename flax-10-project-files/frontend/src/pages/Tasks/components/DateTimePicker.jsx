import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import styles from "./DateTimePicker.module.css";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n) { return String(n).padStart(2, "0"); }

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }));
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => ({ value: String(m), label: pad(m) }));

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

function parseIncomingValue(value, timeOnly) {
  if (!value) return null;
  if (timeOnly && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  return new Date(value);
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", timeOnly = false }) {
  const parsed = useMemo(() => parseIncomingValue(value, timeOnly), [value, timeOnly]);

  const [open,    setOpen]    = useState(false);
  const [viewY,   setViewY]   = useState((parsed || new Date()).getFullYear());
  const [viewM,   setViewM]   = useState((parsed || new Date()).getMonth());
  const [selDate, setSelDate] = useState(parsed);
  const [hour,    setHour]    = useState(parsed ? parsed.getHours()   : 12);
  const [minute,  setMinute]  = useState(parsed ? parsed.getMinutes() : 0);

  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const gap = 6;
    const dropdownHeight = timeOnly ? 130 : 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownPos({
      top: openAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap,
      left: rect.left,
    });
  }, [open, timeOnly]);

  useEffect(() => {
    if (value) {
      const d = parseIncomingValue(value, timeOnly);
      if (!d || Number.isNaN(d.getTime())) return;
      setSelDate(d);
      setHour(d.getHours());
      setMinute(d.getMinutes());
      setViewY(d.getFullYear());
      setViewM(d.getMonth());
    } else {
      setSelDate(null);
    }
  }, [value, timeOnly]);

  // Close on outside interaction 
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (ref.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutside, true);
    document.addEventListener("mousedown", handleOutside, true);
    document.addEventListener("touchstart", handleOutside, true);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("pointerdown", handleOutside, true);
      document.removeEventListener("mousedown", handleOutside, true);
      document.removeEventListener("touchstart", handleOutside, true);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const emitChange = (date, h, m) => {
    if (!date) { onChange?.(""); return; }
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    if (timeOnly) {
      onChange?.(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      return;
    }
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
        <span className={styles.triggerIcon}>{timeOnly ? "🕒" : "📅"}</span>
        <span className={selDate ? styles.triggerValueMono : ""}>
          {selDate
            ? (timeOnly ? `${pad(selDate.getHours())}:${pad(selDate.getMinutes())}` : formatDisplay(selDate))
            : placeholder}
        </span>
        {selDate && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={e => { e.stopPropagation(); setSelDate(null); onChange?.(""); }}
          >✕</button>
        )}
      </button>

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
          {!timeOnly && (
            <>
              <div className={styles.calHeader}>
                <button type="button" className={styles.navBtn} onClick={prevMonth}>‹</button>
                <span className={styles.monthLabel}>{MONTHS[viewM]} {viewY}</span>
                <button type="button" className={styles.navBtn} onClick={nextMonth}>›</button>
              </div>

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
            </>
          )}

          <div className={`${styles.timePicker} ${timeOnly ? styles.timeOnlyPicker : ""}`}>
            <Clock size={14} strokeWidth={2} className={styles.timeIcon} />
            <div className={styles.timeDropdown}>
              <AnimatedDropdown
                value={String(hour)}
                onChange={v => changeHour(Number(v))}
                options={HOUR_OPTIONS}
                placeholder="HH"
                className={styles.timeAnimatedDd}
              />
            </div>
            <span className={styles.timeSep}>:</span>
            <div className={styles.timeDropdown}>
              <AnimatedDropdown
                value={String(minute)}
                onChange={v => changeMinute(Number(v))}
                options={MINUTE_OPTIONS}
                placeholder="MM"
                className={styles.timeAnimatedDd}
              />
            </div>
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
