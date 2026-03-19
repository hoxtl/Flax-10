import { useState, useEffect } from "react";
import { getHomeAddress } from "../../../api/userService";
import { tflService } from "../../../api/tflService";
import { resolveCampusFromText } from "../../../lib/kclCampuses";
import { getCurrentBlock, getNextEvent, hasCampusCommute, getLeaveByInfo, formatTimeLeft } from "../components/RightNowUtils";
import { useCountdown } from "../hooks/useCountdown";
import { formatTime } from "../utils/dateFormatUtils";

export function useCommuteData(isToday, nextEvent) {
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const nextCampus = resolveCampusFromText(nextEvent?.location || nextEvent?.title || "");

  useEffect(() => {
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
  }, [isToday, nextCampus, nextEvent?.start_time]);

  return { commuteInfo, loading, nextCampus };
}

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
    currentProgressPct: calculateProgress(currentBlock, nowMs),
    timeRangeStr: formatRange(currentBlock),
    timeLeftStr: currentBlock?.end_time ? formatTimeLeft(currentBlock.end_time, nowMs) : null,
  };
}

function deriveEmptyDay(props, current, next) {
  const hasEvents = (props.sortedEvents || []).length > 0;
  return props.isToday && !current && !next && !hasEvents;
}

function deriveLeaveByInfo(nextEvent, tflDelays, nowMs) {
  if (!nextEvent) return null;
  const relDelays = (tflDelays || []).filter(d => d.lineName && hasCampusCommute(nextEvent));
  return relDelays.length > 0 ? getLeaveByInfo(nextEvent, relDelays, nowMs) : null;
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
