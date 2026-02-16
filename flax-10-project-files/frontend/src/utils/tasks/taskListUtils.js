import { pinUrgentFirst } from "./taskUtils";

export function partitionTasks(items) {
  const activeRaw = items.filter((x) => !x.done);
  const doneItems = items.filter((x) => x.done);
  const isEmpty = activeRaw.length === 0 && doneItems.length === 0;

  const activePinned = pinUrgentFirst(activeRaw);
  const urgentActive = activePinned.filter((x) => x.urgent);
  const otherActive = activePinned.filter((x) => !x.urgent);
  const anyCompleted = doneItems.length > 0;

  return {
    activeRaw,
    doneItems,
    isEmpty,
    activePinned,
    urgentActive,
    otherActive,
    anyCompleted,
  };
}