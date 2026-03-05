/**
 * Homepage contextual message helpers. Pure functions only.
 */

/** Context-aware motivation header for Plan for the Day. */
export function getMotivationMessage(currentTime, totalTasks, completedTasks, lectureCount) {
  const hour = currentTime.getHours();
  const isMorning = hour < 12;
  const isEvening = hour >= 18;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highCompletion = totalTasks > 0 && (pct >= 50 || completedTasks >= 2);

  if (isEvening && highCompletion) {
    return "Great work today. You've tackled the bulk of your schedule. Time for a breather?";
  }
  if (completedTasks > 0) {
    return `${pct}% of your day is complete — ${completedTasks} goal${completedTasks === 1 ? "" : "s"} crushed!`;
  }
  if (lectureCount > 3) {
    return `It's a big academic day with ${lectureCount} lectures. Pace yourself!`;
  }
  if (isMorning) {
    const taskWord = totalTasks === 1 ? "task" : "tasks";
    const lectWord = lectureCount === 1 ? "lecture" : "lectures";
    return `Good morning! You have ${totalTasks} ${taskWord} and ${lectureCount} ${lectWord} today. Let's get started!`;
  }
  if (totalTasks === 0) {
    return "All clear. Time to add something?";
  }
  return `You have ${totalTasks} item${totalTasks === 1 ? "" : "s"} today. You've got this!`;
}
