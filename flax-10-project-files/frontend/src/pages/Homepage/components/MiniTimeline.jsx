/**
 * Stub timeline for the day. Restore full component from branch if needed.
 */
export function MiniTimeline({
  sortedEvents = [],
  selectedDate,
  now,
  dayTasks = [],
  tasksDueToday = [],
  suggestableTasks = [],
  deadlineSuggestions = [],
  taskLists = [],
  onQuickStart,
  onTaskToggle,
  onCardClick,
  onEdit,
  onConflictAutoMove,
  onDelete,
  onReschedule,
  getTag,
  completedEventIds,
  onToggleComplete,
  hasTimerSession,
  timerTask,
  timeLeft,
  timerMode,
  styles: stylesProp,
}) {
  return (
    <div data-testid="mini-timeline">
      {sortedEvents.length === 0 && (suggestableTasks?.length === 0 || !suggestableTasks) ? (
        <p style={{ margin: 0, padding: "1rem", color: "#6b5f57", fontSize: "0.875rem" }}>
          No events scheduled for this day.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: "0.5rem 0" }}>
          {sortedEvents.map((ev) => (
            <li key={ev.id} style={{ padding: "0.35rem 0", fontSize: "0.875rem" }}>
              {ev.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
