/**
 * Plan timeline row computation. Pure functions only.
 */

import { isNow } from "./eventUtils";
import { extractModuleCode } from "./eventUtils";
import { isRoutineEvent } from "./eventUtils";
import { DAY_START_HOUR, DAY_END_HOUR, GAP_CARD_THRESHOLD_MINS, FIXED_ROW_GAP_PX } from "./timelineUtils";

/* ── KCL campus transit intelligence ── */

const KCL_CAMPUS_KEYWORDS = {
  strand: ["strand", "somerset house", "bush house", "aldwych", "king's building", "kings building", "strand campus", "chancery lane", "king's college london"],
  waterloo: ["waterloo", "fwb", "franklin-wilkins", "franklin wilkins", "stamford street", "coin street"],
  guys: ["guy's", "guys campus", "london bridge", "st thomas street", "great maze pond"],
  denmark: ["denmark hill", "camberwell"],
  stthomasw: ["st thomas'", "st thomas ", "lambeth", "lambeth palace road", "westminster bridge"],
  kingssport: ["king's sport", "kings sport", "ethelburga", "honor oak"],
};

/** One-way transit times between KCL campuses (in minutes). */
const TRANSIT_MINS = {
  "strand-waterloo": 12, "waterloo-strand": 12,
  "strand-guys": 22,     "guys-strand": 22,
  "strand-denmark": 38,  "denmark-strand": 38,
  "strand-stthomasw": 12, "stthomasw-strand": 12,
  "waterloo-guys": 15,   "guys-waterloo": 15,
  "waterloo-denmark": 25, "denmark-waterloo": 25,
  "waterloo-stthomasw": 8, "stthomasw-waterloo": 8,
  "guys-denmark": 25,    "denmark-guys": 25,
  "guys-stthomasw": 20,  "stthomasw-guys": 20,
  "denmark-stthomasw": 30, "stthomasw-denmark": 30,
};

export const CAMPUS_DISPLAY = {
  strand: "Strand",
  waterloo: "Waterloo",
  guys: "Guy's",
  denmark: "Denmark Hill",
  stthomasw: "St Thomas'",
  kingssport: "King's Sport",
};

function getCampusKey(location) {
  if (!location) return null;
  const loc = location.toLowerCase();
  for (const [key, keywords] of Object.entries(KCL_CAMPUS_KEYWORDS)) {
    if (keywords.some((kw) => loc.includes(kw))) return key;
  }
  return null;
}

function getTransitMins(locA, locB) {
  if (!locA || !locB) return 0;
  const campA = getCampusKey(locA);
  const campB = getCampusKey(locB);
  if (!campA || !campB || campA === campB) return 0;
  return TRANSIT_MINS[`${campA}-${campB}`] || 0;
}

/** Classify calendar event into a context category. */
function getEventCategory(item) {
  if (!item) return "neutral";
  const t = (item.title || "").toLowerCase();
  const tag = (item.tag_name ?? item.tag?.name ?? "").toString().toLowerCase();
  if (/lecture|seminar|tutorial|lab\s*session|practical|workshop/i.test(t) || item.source === "timetable") return "lecture";
  if (/study|revision|library|exam|coursework|essay|assignment|group project/i.test(t) || /academic|study/i.test(tag)) return "academic";
  if (/breakfast|lunch|dinner|sleep|brunch|snack|meal/i.test(t) || tag === "routine") return "routine";
  if (/gym|run|yoga|walk|sport|exercise|basketball|jog|stretch|medit|swim/i.test(t) || tag === "wellness") return "wellness";
  if (/coffee|costa|pret|drinks|pub|cinema|birthday|facetime|call|phone|catch up|meet with|restaurant|bar/i.test(t) || tag === "social") return "social";
  if (/shop|tesco|lidl|grocery|laundry|clean|tidy|parcel|delivery|haircut|barber|rent|bills|post office|dentist|doctor|gp|inpost/i.test(t) || tag === "admin") return "admin";
  return "neutral";
}

/**
 * Compute context for a free gap row.
 * Returns { type, transitMins?, prevCampus?, nextCampus?, freeAfterTransit? }
 */
function computeGapContext(prevItem, nextItem, gapStartMins, gapMins) {
  const transitMins = getTransitMins(prevItem?.location, nextItem?.location);

  if (transitMins > 0) {
    const buffer = transitMins + 10; // 10 min buffer for walking to stop etc
    if (gapMins <= buffer) {
      return {
        type: "transit",
        transitMins,
        prevCampus: getCampusKey(prevItem?.location),
        nextCampus: getCampusKey(nextItem?.location),
      };
    }
    return {
      type: "transit-partial",
      transitMins,
      freeAfterTransit: gapMins - transitMins,
      prevCampus: getCampusKey(prevItem?.location),
      nextCampus: getCampusKey(nextItem?.location),
    };
  }

  // Gaps starting at or after 18:00 (720 min from DAY_START_HOUR=6)
  if (gapStartMins >= (18 - DAY_START_HOUR) * 60) {
    return { type: "evening" };
  }

  // Both surrounding events are personal/leisure → don't push study
  const prevCat = getEventCategory(prevItem);
  const nextCat = getEventCategory(nextItem);
  const personalCats = new Set(["social", "routine", "admin", "wellness"]);
  if (personalCats.has(prevCat) && personalCats.has(nextCat)) {
    return { type: "personal" };
  }

  return { type: "study" };
}

function filterEventsInWindow(sortedEvents, dayStart, dayEnd) {
  return (sortedEvents || []).filter((e) => {
    const s = new Date(e.start_time).getTime();
    const eEnd = new Date(e.end_time || e.start_time).getTime();
    return eEnd > dayStart.getTime() && s < dayEnd.getTime();
  });
}

function addGapOrTinyGap(entries, lastEndMins, startMins, i, prevItem = null, nextItem = null) {
  const gapMins = startMins - lastEndMins;
  if (gapMins > 0 && gapMins < GAP_CARD_THRESHOLD_MINS) {
    entries.push({ type: "tinyGap", id: `tiny-${i}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins });
  } else if (gapMins >= GAP_CARD_THRESHOLD_MINS) {
    const gapContext = computeGapContext(prevItem, nextItem, lastEndMins, gapMins);
    entries.push({ type: "free", id: `free-${i}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins, gapStartMins: lastEndMins, gapContext });
  }
}

function buildEventEntry(item, inWindow, i, dayStart, dayEnd, now, dayTasks, tasksDueToday) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time || item.start_time);
  const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
  const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());
  const isPast = end < now;
  const active = isNow(item.start_time, item.end_time);
  const matchTask = (dayTasks || []).find((t) => (t.title || "").trim() === (item.title || "").trim())
    || (tasksDueToday || []).find((t) => (t.title || "").trim() === (item.title || "").trim());
  const modCode = item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description);
  const isRoutine = isRoutineEvent(item);

  let isOverlap = false;
  for (let j = 0; j < inWindow.length; j++) {
    if (j === i) continue;
    const other = inWindow[j];
    const oStart = new Date(other.start_time).getTime();
    const oEnd = new Date(other.end_time || other.start_time).getTime();
    const myStart = start.getTime();
    const myEnd = end.getTime();
    if (oStart < myEnd && oEnd > myStart) {
      isOverlap = true;
      break;
    }
  }

  return {
    type: "event",
    id: item.id,
    item,
    startMins,
    endMins,
    durationMins: endMins - startMins,
    isPast,
    active,
    matchTask,
    isOverlap,
    isRoutine,
    moduleCode: modCode || null,
  };
}

function insertNowMarker(sorted, nowMins) {
  const startMinsOf = (r) => r.startMins ?? r.gapStartMins ?? 0;
  let insertIndex = sorted.length;
  for (let i = 0; i < sorted.length; i++) {
    if (startMinsOf(sorted[i]) > nowMins) {
      insertIndex = i;
      break;
    }
  }
  sorted.splice(insertIndex, 0, { type: "now", id: "now-marker", nowMins });
}

function addSpacing(sorted) {
  const rowStart = (r) => {
    if (r.type === "event") return r.startMins;
    if (r.type === "free" || r.type === "tinyGap") return r.startMins ?? r.gapStartMins;
    return null;
  };
  const rowEnd = (r) => {
    if (r.type === "event") return r.endMins;
    if (r.type === "free" || r.type === "tinyGap") return r.endMins ?? ((r.gapStartMins ?? 0) + (r.minutes ?? 0));
    return null;
  };

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      sorted[i].spacingBeforePx = 0;
      continue;
    }
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevEnd = rowEnd(prev);
    const currStart = rowStart(curr);

    // No visual gap for truly back-to-back timed rows (e.g. 09:00-10:00 then 10:00-12:00).
    if (prevEnd != null && currStart != null && currStart <= prevEnd) {
      sorted[i].spacingBeforePx = 0;
      continue;
    }

    sorted[i].spacingBeforePx = FIXED_ROW_GAP_PX;
  }
}

/** Merge consecutive overlapping event rows into eventGroup rows. */
function _push_chunked_group(result, group, base_row) {
  const chunkSize = 3;
  for (let i = 0; i < group.length; i += chunkSize) {
    const items = group.slice(i, i + chunkSize);
    const start = Math.min(...items.map((item) => item.startMins));
    const end = Math.max(...items.map((item) => item.endMins));
    result.push({
      type: "eventGroup",
      id: `group-${base_row.id}-${Math.floor(i / chunkSize)}`,
      items,
      startMins: start,
      endMins: end,
      spacingBeforePx: i === 0 ? base_row.spacingBeforePx : 0,
    });
  }
}

function groupOverlappingEvents(sorted) {
  const result = [];
  let i = 0;
  while (i < sorted.length) {
    const r = sorted[i];
    if (r.type !== "event") {
      result.push(r);
      i++;
      continue;
    }
    // Greedily collect all events that overlap the growing group window
    const group = [r];
    let groupEndMins = r.endMins;
    let j = i + 1;
    while (j < sorted.length && sorted[j].type === "event" && sorted[j].startMins < groupEndMins) {
      groupEndMins = Math.max(groupEndMins, sorted[j].endMins);
      group.push(sorted[j]);
      j++;
    }
    if (group.length > 1) {
      _push_chunked_group(result, group, r);
    } else {
      result.push(r);
    }
    i = j;
  }
  return result;
}

function injectHourMarks(sorted) {
  const finalRows = [];
  let lastInjectedHour = -1;
  let prevEventEndMins = null; // track last event end to detect adjacent events

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const rStartMins = r.type !== "now" ? (r.startMins ?? r.gapStartMins ?? null) : null;
    let hideTimeLabel = false;

    if (rStartMins != null) {
      const rowHour = DAY_START_HOUR + Math.floor(rStartMins / 60);
      const startsOnHourBoundary = rStartMins % 60 === 0;
      // Don't inject an hour mark between two directly adjacent events (no gap between them).
      // e.g. Lunch ends 13:15 and next event starts 13:15 — the 13:00 mark would appear
      // as a visual bar even though there is zero gap.
      const adjacentToPrev = prevEventEndMins != null && prevEventEndMins >= rStartMins;
      if (rowHour !== lastInjectedHour && !adjacentToPrev) {
        finalRows.push({ type: "hourMark", id: `hour-${rowHour}`, hour: rowHour });
        lastInjectedHour = rowHour;
      }
      // If an hour marker for this same hour is visible, suppress duplicate gutter time labels.
      hideTimeLabel = startsOnHourBoundary && rowHour === lastInjectedHour;
    }

    finalRows.push(hideTimeLabel ? { ...r, hideTimeLabel: true } : r);

    // Update adjacency tracker — now-markers don't break adjacency, gap rows do.
    if (r.type === "event") {
      prevEventEndMins = r.endMins;
    } else if (r.type !== "now") {
      prevEventEndMins = null;
    }
  }
  return finalRows;
}

/** Compute plan timeline rows from events and tasks. */
export function computePlanTimelineRows(sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday, isToday) {
  const inWindow = filterEventsInWindow(sortedEvents, dayStart, dayEnd);
  const entries = [];
  let lastEndMins = null;
  let lastItem = null;

  for (let i = 0; i < inWindow.length; i++) {
    const item = inWindow[i];
    const start = new Date(item.start_time);
    const end = new Date(item.end_time || item.start_time);
    const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
    const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());

    if (lastEndMins != null) {
      addGapOrTinyGap(entries, lastEndMins, startMins, i, lastItem, item);
    }

    entries.push(buildEventEntry(item, inWindow, i, dayStart, dayEnd, now, dayTasks, tasksDueToday));
    lastEndMins = Math.max(lastEndMins ?? 0, endMins);
    lastItem = item;
  }

  const sorted = [...entries].sort((a, b) => (a.startMins ?? 0) - (b.startMins ?? 0));

  addSpacing(sorted);
  const grouped = groupOverlappingEvents(sorted);

  // Insert now-marker AFTER grouping so it doesn't split conflict groups
  const showNow = selectedDate && now && isToday(selectedDate);
  const nowMins = showNow ? Math.max(0, (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes()) : null;
  if (showNow && nowMins != null && nowMins >= 0) {
    insertNowMarker(grouped, nowMins);
  }

  return injectHourMarks(grouped);
}
