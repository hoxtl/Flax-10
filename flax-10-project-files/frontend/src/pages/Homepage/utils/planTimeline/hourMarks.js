/*
 * Hour-mark and now-marker helpers for the plan timeline.
 */

import { DAY_START_HOUR } from "./constants";

function getStartMins(row) {
  return row.type !== "now" ? (row.startMins ?? row.gapStartMins ?? null) : null;
}

function shouldHideTimeLabel(startMins, rowHour, lastInjectedHour) {
  return startMins % 60 === 0 && rowHour === lastInjectedHour;
}

function buildHourMark(rowHour) {
  return { type: "hourMark", id: `hour-${rowHour}`, hour: rowHour };
}

function withHourMark(finalRows, row, lastInjectedHour, prevEventEndMins) {
  const startMins = getStartMins(row);
  if (startMins == null) return { finalRows: [...finalRows, row], lastInjectedHour, prevEventEndMins: row.type === "event" ? row.endMins : row.type === "now" ? prevEventEndMins : null };
  const rowHour = DAY_START_HOUR + Math.floor(startMins / 60);
  const adjacentToPrevious = prevEventEndMins != null && prevEventEndMins >= startMins;
  const nextRows = rowHour !== lastInjectedHour && !adjacentToPrevious ? [...finalRows, buildHourMark(rowHour)] : [...finalRows];
  const nextRow = shouldHideTimeLabel(startMins, rowHour, rowHour) ? { ...row, hideTimeLabel: true } : row;
  return { finalRows: [...nextRows, nextRow], lastInjectedHour: rowHour, prevEventEndMins: row.type === "event" ? row.endMins : null };
}

export function insertNowMarker(rows, nowMins) {
  const insertIndex = rows.findIndex((row) => (row.startMins ?? row.gapStartMins ?? 0) > nowMins);
  const marker = { type: "now", id: "now-marker", nowMins };
  return insertIndex === -1 ? [...rows, marker] : [...rows.slice(0, insertIndex), marker, ...rows.slice(insertIndex)];
}

export function injectHourMarks(rows) {
  return rows.reduce((state, row) => withHourMark(state.finalRows, row, state.lastInjectedHour, state.prevEventEndMins), {
    finalRows: [],
    lastInjectedHour: -1,
    prevEventEndMins: null,
  }).finalRows;
}
