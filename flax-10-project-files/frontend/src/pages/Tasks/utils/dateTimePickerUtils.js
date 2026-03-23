/*
 * Helpers for DateTimePicker: parse, format, calendar grid.
 */

import {
  pad,
  calendarDays,
  parseIncomingValue as parseDateTimePickerValue,
  emitDateTimeChange,
} from "../../../components/common/inputs/dateTimePickerUtils";

export { pad, calendarDays };

export function formatDisplay(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + "  " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

export function parseIncomingValue(value, timeOnly) {
  return parseDateTimePickerValue(value, timeOnly, false);
}

export function emitChange(onChange, timeOnly, date, h, m) {
  emitDateTimeChange(date, h, m, timeOnly, false, onChange);
}
