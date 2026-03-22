/*
 * Hooks for DateTimePicker: state, value sync, dropdown position, and interaction handlers.
 */

import { useState, useEffect, useMemo } from "react";
import {
  parseIncomingValue, emitDateTimeChange, handleDaySelect, handleHourChange,
  handleMinuteChange, navigateMonth, calendarDays, isBeforeMinDate,
  getDropdownHeight, getDropdownWidth, clamp,
} from "./dateTimePickerUtils";

export function computeDropdownPos(rect, timeOnly, dateOnly) {
  const gap = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dropH = getDropdownHeight(timeOnly, dateOnly);
  const dropW = Math.min(getDropdownWidth(), Math.max(220, vw - gap * 2));
  return {
    top: clamp(rect.bottom + gap, gap, Math.max(gap, vh - dropH - gap)),
    left: clamp(rect.left, gap, Math.max(gap, vw - dropW - gap)),
  };
}

export function useDropdownPosition(open, ref, timeOnly, dateOnly, setDropdownPos) {
  useEffect(() => {
    if (!open) return;
    const update = () => ref.current && setDropdownPos(computeDropdownPos(ref.current.getBoundingClientRect(), timeOnly, dateOnly));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [open, timeOnly, dateOnly, ref, setDropdownPos]);
}

function syncValueToState(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM) {
  if (!value) { setSelDate(null); return; }
  const d = parseIncomingValue(value, timeOnly, dateOnly);
  if (!d || Number.isNaN(d.getTime())) return;
  setSelDate(d);
  setHour(d.getHours());
  setMinute(d.getMinutes());
  setViewY(d.getFullYear());
  setViewM(d.getMonth());
}

export function useSyncValue(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM) {
  useEffect(() => {
    syncValueToState(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM);
  }, [value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM]);
}

function makeOutsideHandler(ref, dropdownRef, setOpen) {
  return (e) => {
    if (ref.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
    if (e.target.closest('[data-dropdown-portal="true"]') !== null) return;
    setOpen(false);
  };
}

export function useClickOutside(open, ref, dropdownRef, setOpen) {
  useEffect(() => {
    if (!open) return;
    const handleOutside = makeOutsideHandler(ref, dropdownRef, setOpen);
    const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", handleOutside, true);
    document.addEventListener("keydown", handleEsc);
    return () => { document.removeEventListener("pointerdown", handleOutside, true); document.removeEventListener("keydown", handleEsc); };
  }, [open, ref, dropdownRef, setOpen]);
}

export function useDateTimePickerState(value, timeOnly, dateOnly) {
  const parsed = useMemo(() => parseIncomingValue(value, timeOnly, dateOnly), [value, timeOnly, dateOnly]);
  const now = parsed || new Date();
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [selDate, setSelDate] = useState(parsed);
  const [hour, setHour] = useState(parsed?.getHours() ?? 12);
  const [minute, setMinute] = useState(parsed?.getMinutes() ?? 0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  return { open, setOpen, viewY, setViewY, viewM, setViewM, selDate, setSelDate, hour, setHour, minute, setMinute, dropdownPos, setDropdownPos };
}

export function useDateTimeHandlers(viewY, viewM, setViewM, setViewY, selDate, setSelDate, hour, setHour, minute, setMinute, timeOnly, dateOnly, onChange) {
  const emitChange = (date, h, m) => emitDateTimeChange(date, h, m, timeOnly, dateOnly, onChange);
  const selectDay = (day) => handleDaySelect(day, viewY, viewM, setSelDate, emitChange, hour, minute);
  const changeHour = (h) => handleHourChange(h, setHour, selDate, emitChange, minute);
  const changeMinute = (m) => handleMinuteChange(m, setMinute, selDate, emitChange, hour);
  return { selectDay, changeHour, changeMinute, prevMonth: () => navigateMonth(-1, viewM, setViewM, setViewY), nextMonth: () => navigateMonth(1, viewM, setViewM, setViewY) };
}

export function useDerivedCalendarState(viewY, viewM, selDate, minDate) {
  const days = calendarDays(viewY, viewM);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
  const isSel = (d) => selDate && d === selDate.getDate() && viewM === selDate.getMonth() && viewY === selDate.getFullYear();
  const isDisabled = (d) => isBeforeMinDate(new Date(viewY, viewM, d), minDate);
  return { days, isToday, isSel, isDisabled };
}
