import { pinUrgentFirst } from "./taskUtils";

function getActivePartitions(activeRaw) {
  const activePinned = pinUrgentFirst(activeRaw);
  return {
    activePinned,
    urgentActive: activePinned.filter((x) => x.urgent),
    otherActive: activePinned.filter((x) => !x.urgent),
  };
}

export function partitionTasks(items) {
  const activeRaw = items.filter((x) => !x.done);
  const doneItems = items.filter((x) => x.done);
  const { activePinned, urgentActive, otherActive } = getActivePartitions(activeRaw);
  return {
    activeRaw, doneItems,
    isEmpty: activeRaw.length === 0 && doneItems.length === 0,
    activePinned, urgentActive, otherActive,
    anyCompleted: doneItems.length > 0,
  };
}