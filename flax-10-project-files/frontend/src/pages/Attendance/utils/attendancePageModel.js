/*
 * Attendance page view model builders.
 */

import { recordAttendance } from "../../../api/attendanceApi";
import { buildByTypeChartData, buildOverallChartData, withByTypeColors } from "./attendanceChartData";
import { buildMarkedEvents, buildUnmarkedEvents } from "./attendanceRecords";
import { buildSegmentEvents, buildSegmentLabel } from "./attendanceSegments";
import { buildAttendanceSummary, getByTypeStats, getOverallStats } from "./attendanceSummary";

function createRefetchAll(statsState, recordsState) {
  return () => {
    statsState.refetch();
    recordsState.refetch();
  };
}

function createSegmentSelector(setSelectedSegment) {
  return (chart, label) => setSelectedSegment(label ? { chart, label } : null);
}

function createToggleHandler(refetchAll) {
  return async (eventId, attended) => {
    await recordAttendance(eventId, attended);
    refetchAll();
  };
}

function buildAttendanceCollections(statsState, recordsState, eventsState, selectedSegment) {
  const overall = getOverallStats(statsState.stats);
  const byType = getByTypeStats(statsState.stats);
  const unmarkedEvents = buildUnmarkedEvents(eventsState.events, recordsState.recordsByEventId);
  const markedEvents = buildMarkedEvents(eventsState.events, recordsState.recordsByEventId);
  return { overall, unmarkedEvents, markedEvents, segmentEvents: buildSegmentEvents(selectedSegment, markedEvents), overallData: buildOverallChartData(overall), byTypeData: withByTypeColors(buildByTypeChartData(byType)) };
}

export function buildAttendancePageModel(selection, statsState, recordsState, eventsState) {
  const collections = buildAttendanceCollections(statsState, recordsState, eventsState, selection.selectedSegment);
  const refetchAll = createRefetchAll(statsState, recordsState);
  return { ...collections, ...selection, loading: statsState.loading, error: statsState.error, eventsLoading: eventsState.loading, summary: buildAttendanceSummary(collections.overall, collections.unmarkedEvents.length), segmentLabel: buildSegmentLabel(selection.selectedSegment), refetchAll, handleToggleStatus: createToggleHandler(refetchAll), selectSegment: createSegmentSelector(selection.setSelectedSegment), clearSegment: () => selection.setSelectedSegment(null), showRecordTab: () => selection.setListTab("record"), showMarkedTab: () => selection.setListTab("marked") };
}
