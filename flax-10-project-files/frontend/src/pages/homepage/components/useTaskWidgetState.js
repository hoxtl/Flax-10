import { useMemo, useState } from "react";

export function useTaskWidgetState(props) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const taskGroups = useMemo(() => getTaskGroups(props.taskWidgetList, props.row), [props.row, props.taskWidgetList]);
  return { ...taskGroups, ctxMenu, setCtxMenu, expanded, setExpanded, showCompleted, setShowCompleted };
}

function getTaskGroups(taskWidgetList, _row) {
  const incompleteTasks = (taskWidgetList || []).filter((task) => !task.completed);
  const completedTasks = (taskWidgetList || []).filter((task) => task.completed);
  const visibleLimit = 3;
  return {
    allTasksDone: taskWidgetList?.length > 0 && taskWidgetList.every((task) => task.completed),
    completedTasks,
    initialTasks: incompleteTasks.slice(0, visibleLimit),
    extraTasks: incompleteTasks.slice(visibleLimit),
    visibleCompleted: completedTasks,
  };
}
