<<<<<<< HEAD
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
} from "../components/rightNowUtils";
import { useCountdown } from "./useCountdown";
import { formatTime } from "../utils/dateFormatUtils";

function useCommuteData(isToday, nextEvent) {
=======
import { useState, useEffect } from "react";
import { getHomeAddress } from "../../../api/userApi";
import { tflService } from "../../../api/tflApi";
import { resolveCampusFromText } from "../../../lib/kclCampuses";
import { getCurrentBlock, getNextEvent, hasCampusCommute, getLeaveByInfo, formatTimeLeft } from "../components/RightNowUtils";
import { useCountdown } from "../hooks/useCountdown";
import { formatTime } from "../utils/dateFormatUtils";

export function useCommuteData(isToday, nextEvent) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const nextCampus = resolveCampusFromText(nextEvent?.location || nextEvent?.title || "");

  useEffect(() => {
<<<<<<< HEAD
    return syncCommute(isToday, nextCampus, nextEvent, setCommuteInfo, setLoading);
=======
    let cancelled = false;
    const shouldFetch = isToday && nextCampus && nextEvent?.start_time;
    if (!shouldFetch) {
      setCommuteInfo(null);
      return;
    }
    
    const handleFetch = async () => {
      setLoading(true);
      const journey = await fetchJourney(nextCampus);
      if (!cancelled) setCommuteInfo(journey);
      if (!cancelled) setLoading(false);
    };

    handleFetch();
    return () => { cancelled = true; };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  }, [isToday, nextCampus, nextEvent?.start_time]);

  return { commuteInfo, loading, nextCampus };
}

<<<<<<< HEAD
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
=======
async function fetchJourney(campus) {
  try {
    const home = await getHomeAddress();
    const { home_latitude: lat, home_longitude: lng } = home;
    const isValid = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    if (!isValid) return null;
    return await tflService.journeyPlanner(lat, lng, campus.coords[1], campus.coords[0]);
  } catch (_) {
    return null;
  }
}

export function useRightNowAlerts() {
  const [showConflictAlert, setShowConflictAlert] = useState(true);
  const [showTflAlert, setShowTflAlert] = useState(true);
  
  return {
    showConflictAlert,
    setShowConflictAlert,
    showTflAlert,
    setShowTflAlert
  };
}

export function useRightNowData(props) {
  const data = useBaseData(props);
  const commute = useCommuteData(props.isToday, data.nextEvent);
  const alerts = useRightNowAlerts();

  return {
    ...data,
    ...commute,
    ...alerts,
    eventCount: (props.sortedEvents || []).length,
    tasksPending: (props.taskWidgetItemsOnly || []).filter(t => !t.completed).length,
    isEndOfDay: (props.navigatorContext || {}).state === "endOfDay",
    isEmptyDay: deriveEmptyDay(props, data.currentBlock, data.nextEvent)
  };
}

function useBaseData(props) {
  const { now, sortedEvents, tflDelays, navigatorContext } = props;
  const nowMs = now.getTime();
  const nav = navigatorContext || {};
  
  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], now);
  const nextEvent = nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], now);
  
  return {
    currentBlock,
    nextEvent,
    countdown: useCountdown(nextEvent?.start_time ? new Date(nextEvent.start_time) : null),
    leaveByInfo: deriveLeaveByInfo(nextEvent, tflDelays, nowMs),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    currentProgressPct: calculateProgress(currentBlock, nowMs),
    timeRangeStr: formatRange(currentBlock),
    timeLeftStr: currentBlock?.end_time ? formatTimeLeft(currentBlock.end_time, nowMs) : null,
  };
}

<<<<<<< HEAD
=======
function deriveEmptyDay(props, current, next) {
  const hasEvents = (props.sortedEvents || []).length > 0;
  return props.isToday && !current && !next && !hasEvents;
}

function deriveLeaveByInfo(nextEvent, tflDelays, nowMs) {
  if (!nextEvent) return null;
  const relDelays = (tflDelays || []).filter(d => d.lineName && hasCampusCommute(nextEvent));
  return relDelays.length > 0 ? getLeaveByInfo(nextEvent, relDelays, nowMs) : null;
}



>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD

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
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
