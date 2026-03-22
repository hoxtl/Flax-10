/**
 * Homepage resource-loading hook.
 */

import { useCallback, useEffect, useState } from "react";
import { getModules, getEnrollments } from "../../../api/modules/moduleApi";
import { getUpcomingDeadlines } from "../../../api/calendar/deadlineApi";
import { fetchTaskLists } from "../../../api/tasks/taskApi";

function getSafeList(value) {
  return Array.isArray(value) ? value : [];
}

function useHomepageList(loader) {
  const [items, setItems] = useState([]);

  const refresh = useCallback(() => {
    return loader().then(getSafeList).then((nextItems) => {
      setItems(nextItems);
      return nextItems;
    }).catch(() => {
      setItems([]);
      return [];
    });
  }, [loader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return [items, setItems, refresh];
}

export function useHomepageResources() {
  const [modulesList] = useHomepageList(getModules);
  const [enrollments] = useHomepageList(getEnrollments);
  const [upcomingDeadlines] = useHomepageList(getUpcomingDeadlines);
  const [taskLists, setTaskLists, refreshTaskLists] = useHomepageList(fetchTaskLists);

  return {
    modulesList,
    enrollments,
    upcomingDeadlines,
    taskLists,
    setTaskLists,
    refreshTaskLists,
  };
}
