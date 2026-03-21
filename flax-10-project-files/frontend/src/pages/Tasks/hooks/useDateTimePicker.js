/*
 * Date-time picker state, positioning, and change handlers.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { parseIncomingValue, emitChange as emitChangeUtil, calendarDays } from "../utils/dateTimePickerUtils";

function useDateTimePickerState(parsed) {
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState((parsed || new Date()).getFullYear());
  const [viewM, setViewM] = useState((parsed || new Date()).getMonth());
  const [selDate, setSelDate] = useState(parsed);
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 12);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  return { open, setOpen, viewY, setViewY, viewM, setViewM, selDate, setSelDate, hour, setHour, minute, setMinute, dropdownPos, setDropdownPos, ref, dropdownRef };
}

function useDateTimePickerDropdownPos(ref, open, timeOnly, setDropdownPos) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const gap = 6;
    const dropdownHeight = timeOnly ? 130 : 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownPos({ top: openAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap, left: rect.left });
  }, [open, timeOnly, ref, setDropdownPos]);
}

function useDateTimePickerValueSync(value, timeOnly, setSelDate, setHour, setMinute, setViewY, setViewM) {
  useEffect(() => {
    const d = value ? parseIncomingValue(value, timeOnly) : null;
    if (!d || Number.isNaN(d.getTime())) {
      setSelDate(null);
      return;
    }
    setSelDate(d);
    setHour(d.getHours());
    setMinute(d.getMinutes());
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
  }, [value, timeOnly, setSelDate, setHour, setMinute, setViewY, setViewM]);
}

function addOutsideCloseListeners(ref, dropdownRef, setOpen) {
  const handleOutside = (e) => {
    if (ref.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
    setOpen(false);
  };
  const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
  document.addEventListener("pointerdown", handleOutside, true);
  document.addEventListener("mousedown", handleOutside, true);
  document.addEventListener("touchstart", handleOutside, true);
  document.addEventListener("keydown", handleEsc);
  return function remove() {
    document.removeEventListener("pointerdown", handleOutside, true);
    document.removeEventListener("mousedown", handleOutside, true);
    document.removeEventListener("touchstart", handleOutside, true);
    document.removeEventListener("keydown", handleEsc);
  };
}

function useDateTimePickerOutsideClose(open, ref, dropdownRef, setOpen) {
  useEffect(() => {
    if (!open) return;
    return addOutsideCloseListeners(ref, dropdownRef, setOpen);
  }, [open, ref, dropdownRef, setOpen]);
}

function selectMonth(direction, viewM, setViewM, setViewY) {
  if (direction === "prev" && viewM === 0) { setViewY((year) => year - 1); setViewM(11); return; }
  if (direction === "next" && viewM === 11) { setViewY((year) => year + 1); setViewM(0); return; }
  return setViewM((month) => month + (direction === "prev" ? -1 : 1));
}

function useDateTimePickerCallbacks(state, onChange, timeOnly) {
  const { viewY, viewM, selDate, hour, minute, setSelDate, setHour, setMinute, setViewM, setViewY } = state;
  const emitChange = (date, nextHour, nextMinute) => emitChangeUtil(onChange, timeOnly, date, nextHour, nextMinute);
  const selectDay = (day) => {
    const d = new Date(viewY, viewM, day);
    setSelDate(d);
    emitChange(d, hour, minute);
  };
  const changeHour = (nextHour) => { setHour(nextHour); if (selDate) emitChange(selDate, nextHour, minute); };
  const changeMinute = (nextMinute) => { setMinute(nextMinute); if (selDate) emitChange(selDate, hour, nextMinute); };
  const prevMonth = () => selectMonth("prev", viewM, setViewM, setViewY);
  const nextMonth = () => selectMonth("next", viewM, setViewM, setViewY);
  const today = useMemo(() => new Date(), []);
  const isToday = (day) => day === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
  const isSel = (day) => selDate && day === selDate.getDate() && viewM === selDate.getMonth() && viewY === selDate.getFullYear();
  const clearSelection = () => { setSelDate(null); onChange?.(""); };
  const days = useMemo(() => calendarDays(viewY, viewM), [viewY, viewM]);
  return { selectDay, changeHour, changeMinute, prevMonth, nextMonth, days, isToday, isSel, clearSelection };
}

export default function useDateTimePicker(value, onChange, timeOnly) {
  const parsed = useMemo(() => parseIncomingValue(value, timeOnly), [value, timeOnly]);
  const state = useDateTimePickerState(parsed);
  useDateTimePickerDropdownPos(state.ref, state.open, timeOnly, state.setDropdownPos);
  useDateTimePickerValueSync(value, timeOnly, state.setSelDate, state.setHour, state.setMinute, state.setViewY, state.setViewM);
  useDateTimePickerOutsideClose(state.open, state.ref, state.dropdownRef, state.setOpen);
  const callbacks = useDateTimePickerCallbacks(state, onChange, timeOnly);
  return { ...state, ...callbacks, timeOnly };
}
