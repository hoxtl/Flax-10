import { useEffect, useMemo, useState } from "react";
import { getEnrollments, getModules } from "../../api/moduleApi";
import { fetchTaskLists } from "../../api/taskApi";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";

function loadTaskLists(setLists) {
  fetchTaskLists().then((response) => setLists(Array.isArray(response) ? response : [])).catch(() => {});
}

function loadModules(setModules) {
  getModules().then((response) => setModules(Array.isArray(response) ? response : [])).catch(() => {});
}

function loadEnrollments(setEnrollments) {
  getEnrollments().then((response) => setEnrollments(Array.isArray(response) ? response : [])).catch(() => {});
}

function useEnrolledModules(modules, enrollments) {
  return useMemo(
    () => modules.filter((module) => isEnrolledIn(module.id, enrollments)),
    [modules, enrollments],
  );
}

export function useDashboardTaskModalOptions() {
  const [lists, setLists] = useState([]);
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    loadTaskLists(setLists);
    loadModules(setModules);
    loadEnrollments(setEnrollments);
  }, []);

  return { lists, enrolledModules: useEnrolledModules(modules, enrollments) };
}
