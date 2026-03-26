import { useEffect, useState } from "react";
import { getModules } from "../../../api/moduleApi";
import { getSharedWithMe, getSharingWith } from "../../../api/socialApi";
import { fetchTasks } from "../../../api/taskApi";

function buildModuleNameMap(data) {
  const list = Array.isArray(data) ? data : data?.results || [];
  const entries = list
    .filter((moduleItem) => moduleItem.module_code)
    .map((moduleItem) => [moduleItem.module_code, moduleItem.module_name]);
  return Object.fromEntries(entries);
}

export function useModuleNameMap(isOpen) {
  const [nameMap, setNameMap] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    getModules().then((data) => setNameMap(buildModuleNameMap(data))).catch(() => {});
  }, [isOpen]);

  return nameMap;
}

function sortByDueDate(leftDate, rightDate) {
  if (!leftDate) return 1;
  if (!rightDate) return -1;
  return new Date(leftDate) - new Date(rightDate);
}

function sortOpenTasks(data) {
  const list = Array.isArray(data) ? data : data?.results || [];
  return list
    .filter((task) => !task.completed)
    .sort((left, right) => sortByDueDate(left.due_date, right.due_date));
}

function resetTasks(setLoading, setTasks) {
  setTasks([]);
  setLoading(false);
}

export function useTasksModalData(isOpen) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return resetTasks(setLoading, setTasks);
    setLoading(true);
    fetchTasks()
      .then(sortOpenTasks)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return { loading, tasks };
}

export function useSocialUsers(isOpen, userId, fetchFn) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!(isOpen && userId)) {
      setUsers([]);
      return;
    }

    fetchFn(userId)
      .then((data) => setUsers(data.results || data))
      .catch(() => {
        setUsers([]);
      });
  }, [fetchFn, isOpen, userId]);

  return users;
}

export const socialDataFetchers = {
  sharedWithMe: getSharedWithMe,
  sharingWith: getSharingWith,
};
