/*
 * Self-contained date and time picker with an inline calendar and time dropdowns.
 */

import { useRef } from "react";
import { createPortal } from "react-dom";
import { TriggerButton, DropdownPanel } from "./DateTimePickerParts";
import { useDateTimePickerState, useDateTimeHandlers, useDerivedCalendarState, useDropdownPosition, useSyncValue, useClickOutside } from "./useDateTimePicker";
import styles from "./DateTimePicker.module.css";

function PickerTrigger({ customTrigger, setOpen, ...props }) {
  if (customTrigger)
    return <div onClick={() => setOpen(p => !p)} style={{ cursor: "pointer" }}>{customTrigger}</div>;
  return <TriggerButton setOpen={setOpen} {...props} />;
}

function PickerPortal({ open, dropdownRef, dropdownPos, ...props }) {
  if (!open) return null;
  return createPortal(<DropdownPanel ref={dropdownRef} pos={dropdownPos} {...props} />, document.body);
}

/** Date and time picker with an inline calendar and dropdowns for hour and minute. */

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", timeOnly = false, dateOnly = false, customTrigger = null, triggerClassName, wrapperClassName, hideIcon, minDate = null }) {
  const { open, setOpen, viewY, setViewY, viewM, setViewM, selDate, setSelDate, hour, setHour, minute, setMinute, dropdownPos, setDropdownPos } = useDateTimePickerState(value, timeOnly, dateOnly);
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  useDropdownPosition(open, ref, timeOnly, dateOnly, setDropdownPos);
  useSyncValue(value, timeOnly, dateOnly, setSelDate, setHour, setMinute, setViewY, setViewM);
  useClickOutside(open, ref, dropdownRef, setOpen);
  const handlers = useDateTimeHandlers(viewY, viewM, setViewM, setViewY, selDate, setSelDate, hour, setHour, minute, setMinute, timeOnly, dateOnly, onChange);
  const calState = useDerivedCalendarState(viewY, viewM, selDate, minDate);
  return (
    <div className={`${styles.wrap} ${wrapperClassName || ""}`} ref={ref}>
      <PickerTrigger customTrigger={customTrigger} setOpen={setOpen} open={open} selDate={selDate} timeOnly={timeOnly} dateOnly={dateOnly} placeholder={placeholder} setSelDate={setSelDate} onChange={onChange} triggerClassName={triggerClassName} hideIcon={hideIcon} />
      <PickerPortal open={open} dropdownRef={dropdownRef} dropdownPos={dropdownPos} timeOnly={timeOnly} dateOnly={dateOnly} viewM={viewM} viewY={viewY} {...handlers} {...calState} hour={hour} minute={minute} setOpen={setOpen} />
    </div>
  );
}
