import { useState, useMemo } from "react";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { getEstTime } from "../components/TaskWidgetUtils";

const VISIBLE_COUNT = 3;

export function useTaskWidgetState(props) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { taskWidgetList = [], taskWidgetItemsOnly = [], showAllTaskWidgetTasks } = props;

  const incompleteTasks = taskWidgetList.filter((t) => !t.completed);
  const completedTasks = taskWidgetList.filter((t) => t.completed);
  
  const visibleIncomplete = showAllTaskWidgetTasks ? incompleteTasks : incompleteTasks.slice(0, VISIBLE_COUNT);
  const visibleCompleted = completedTasks.slice(0, 3);
  
  const allTasksDone = taskWidgetItemsOnly.length > 0 && taskWidgetItemsOnly.every((t) => t.completed);
  const clearMessage = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);

  return {
    ctxMenu, setCtxMenu,
    showCompleted, setShowCompleted,
    incompleteTasks,
    completedTasks,
    visibleIncomplete,
    visibleCompleted,
    allTasksDone,
    clearMessage,
    incompleteCount: taskWidgetItemsOnly.filter((i) => !i.completed).length,
    estimatedLeft: getEstTime(taskWidgetList),
    hiddenCount: Math.max(0, incompleteTasks.length - VISIBLE_COUNT)
  };
}
