export function buildMarkedEvents(records) {
  return records
    .map((record) => ({
      id: record.event_id,
      title: record.title || "Untitled Event",
      start_time: record.start_time,
      attended: record.attended,
      event_type: record.event_type,
    }))
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
}

export function getEventsForSegment(segment, attendedEvents, missedEvents, allEvents) {
  if (!segment) return [];
  if (segment.chart === "overall") {
    return segment.label === "Attended" ? attendedEvents : missedEvents;
  }
  if (segment.chart === "byType") {
    return allEvents.filter((event) => event.event_type === segment.label);
  }
  return [];
}

export function computeAttendancePct(overall) {
  const total = overall.attended + overall.missed;
  return total > 0 ? Math.round((overall.attended / total) * 100) : 100;
}

export function buildSegmentEvents(selectedSegment, markedEvents) {
  const attendedEvents = markedEvents.filter((event) => event.attended);
  const missedEvents = markedEvents.filter((event) => !event.attended);
  return getEventsForSegment(selectedSegment, attendedEvents, missedEvents, markedEvents);
}
