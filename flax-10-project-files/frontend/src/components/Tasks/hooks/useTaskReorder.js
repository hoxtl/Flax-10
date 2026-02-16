import { pinUrgentFirst } from "../utils/taskUtils";

export function useTaskReorder(setItems) {
  const onReorderActive = (newOrder) => {
    const pinned = pinUrgentFirst(newOrder);
    setItems((prev) => {
      const done = prev.filter((x) => x.done);
      return [...pinned, ...done];
    });
  };

  return { onReorderActive };
}