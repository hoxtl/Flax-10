/**
 * Right Now derived state hook.
 */

import { useEffect, useState } from "react";
import { getHomeAddress } from "../../../api/userApi";
import { tflService } from "../../../api/tflApi";
import { resolveCampusFromText } from "../../../lib/kclCampuses";
import {
  formatTimeLeft,
  getCurrentBlock,
  getLeaveByInfo,
  getNextEvent,
  hasCampusCommute,
} from "../components/RightNowUtils";
import { useCountdown } from "./useCountdown";
import { formatTime } from "../utils/dateFormatUtils";

function useCommuteData(isToday, nextEvent) {
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const nextCampus = resolveCampusFromText(nextEvent?.location || nextEvent?.title || "");

  useEffect(() => {
    return syncCommute(isToday, nextCampus, nextEvent, setCommuteInfo, setLoading);
  }, [isToday, nextCampus, nextEvent?.start_time]);

  return { commuteInfo, loading, nextCampus };
}

function syncCommute(isToday, nextCampus, nextEvent, setCommuteInfo, setLoading) {
  let cancelled = false;
  if (!isToday || !nextCampus || !nextEvent?.start_time) {
    setCommuteInfo(null);
    setLoading(false);
    return undefined;
  }

  loadCommute(nextCampus, setCommuteInfo, setLoading, () => cancelled);
  return () => {
    cancelled = true;
  };
}

async function loadCommute(nextCampus, setCommuteInfo, setLoading, isCancelled) {
  setLoading(true);
  const journey = await fetchJourney(nextCampus);
  if (!isCancelled()) setCommuteInfo(journey);
  if (!isCancelled()) setLoading(false);
}

async function fetchJourney(campus) {
  return getHomeAddress()
    .then((home) => planJourney(home, campus))
    .catch(() => null);
}

function getHomeCoords(home) {
  const lat = Number(home?.home_latitude);
  const lng = Number(home?.home_longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function planJourney(home, campus) {
  const homeCoords = getHomeCoords(home);
  if (!homeCoords) return null;
  return tflService.journeyPlanner(homeCoords.lat, homeCoords.lng, campus.coords[1], campus.coords[0]);
}

function useRightNowAlerts() {
  const [showConflictAlert, setShowConflictAlert] = useState(true);
  const [showTflAlert, setShowTflAlert] = useState(true);
  return { showConflictAlert, setShowConflictAlert, showTflAlert, setShowTflAlert };
}

function getCurrentDateMs(now) {
  return now instanceof Date ? now.getTime() : Date.now();
}

function getDerivedLeaveByInfo(nextEvent, tflDelays, nowMs) {
  if (!nextEvent || !hasCampusCommute(nextEvent)) return null;
  const relevant = (tflDelays || []).filter((delay) => delay.lineName);
  return relevant.length > 0 ? getLeaveByInfo(nextEvent, relevant, nowMs) : null;
}

function useCurrentTimelineState(props, nowMs) {
  const nav = props.navigatorContext || {};
  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(props.sortedEvents || [], props.now);
  const nextEvent = nav.nextItem ?? nav.next ?? getNextEvent(props.sortedEvents || [], props.now);
  const countdown = useCountdown(nextEvent?.start_time ? new Date(nextEvent.start_time) : null);
  const leaveByInfo = getDerivedLeaveByInfo(nextEvent, props.tflDelays, nowMs);
  return {
    currentBlock,
    nextEvent,
    countdown,
    leaveByInfo,
    currentProgressPct: calculateProgress(currentBlock, nowMs),
    timeRangeStr: formatRange(currentBlock),
    timeLeftStr: currentBlock?.end_time ? formatTimeLeft(currentBlock.end_time, nowMs) : null,
  };
}

function calculateProgress(block, nowMs) {
  if (!block?.start_time || !block?.end_time) return null;
  const start = new Date(block.start_time).getTime();
  const end = new Date(block.end_time).getTime();
  return Math.min(100, Math.max(0, ((nowMs - start) / (end - start)) * 100));
}

function formatRange(block) {
  if (!block?.start_time || !block?.end_time) return null;
  return `${formatTime(block.start_time)} – ${formatTime(block.end_time)}`;
}

function isEmptyToday(props, currentBlock, nextEvent) {
  return props.isToday && !currentBlock && !nextEvent && (props.sortedEvents || []).length === 0;
}

export function useRightNowData(props) {
  const nowMs = getCurrentDateMs(props.now);
  const timeline = useCurrentTimelineState(props, nowMs);
  const commute = useCommuteData(props.isToday, timeline.nextEvent);
  const alerts = useRightNowAlerts();
  const conflicts = Array.isArray(props.navigatorContext?.overlaps) ? props.navigatorContext.overlaps : [];
  const showTfl = Boolean(timeline.nextEvent && commute.nextCampus && timeline.leaveByInfo);

  return {
    ...timeline,
    ...commute,
    ...alerts,
    conflicts,
    eventCount: (props.sortedEvents || []).length,
    isEmptyDay: isEmptyToday(props, timeline.currentBlock, timeline.nextEvent),
    isEndOfDay: (props.navigatorContext || {}).state === "endOfDay",
    showTfl,
    tasksPending: (props.taskWidgetItemsOnly || []).filter((task) => !task.completed).length,
  };
}
