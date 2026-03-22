import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getModules, getEnrollments } from "../../../api/modules/moduleApi";
import { getUpcomingDeadlines } from "../../../api/calendar/deadlineApi";
import { getUserSettings, updateUserSettings } from "../../../api/user/userApi";
import { fetchTaskLists } from "../../../api/tasks/taskApi";

export function useHomepageState() {
  const [modulesList, setModulesList] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const getInitialWidgets = () => {
    try {
      const cached = localStorage.getItem("homepageLayout");
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return [
      { id: "rightNow", type: "system" },
      { id: "tasks", type: "system" },
      { id: "deadlines", type: "system" }
    ];
  };

  const [homepageWidgets, setHomepageWidgets] = useState(() => getInitialWidgets());

  const displayName = useMemo(() => {
    try {
      const s = localStorage.getItem("user");
      if (!s) return null;
      const u = JSON.parse(s);
      return (u.first_name || "").trim() || (u.username || "").trim() || null;
    } catch {
      return null;
    }
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((msg, opts = {}) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, actionLabel: opts.actionLabel || null, onAction: opts.onAction || null });
    toastTimeoutRef.current = setTimeout(() => setToast(null), opts.durationMs || 3200);
  }, []);

  useEffect(() => {
    getUserSettings().then((settings) => {
      if (settings.homepage_widgets?.length) {
        setHomepageWidgets(settings.homepage_widgets);
        localStorage.setItem("homepageLayout", JSON.stringify(settings.homepage_widgets));
      }
    }).catch(() => { /* ignore */ });
  }, []);

  const saveWidgetLayout = async (newLayout) => {
    setHomepageWidgets(newLayout);
    localStorage.setItem("homepageLayout", JSON.stringify(newLayout));
    try { await updateUserSettings({ homepage_widgets: newLayout }); } catch { showToast("Failed to save layout."); }
  };

  useEffect(() => { getModules().then(res => setModulesList(Array.isArray(res) ? res : [])).catch(()=>setModulesList([])); }, []);
  useEffect(() => { getEnrollments().then(res => setEnrollments(Array.isArray(res) ? res : [])).catch(()=>setEnrollments([])); }, []);
  useEffect(() => { getUpcomingDeadlines().then(res => setUpcomingDeadlines(Array.isArray(res) ? res : [])).catch(()=>setUpcomingDeadlines([])); }, []);
  useEffect(() => { fetchTaskLists().then(res => setTaskLists(Array.isArray(res) ? res : [])).catch(()=>setTaskLists([])); }, []);
  useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);

  return {
    displayName,
    modulesList, enrollments, upcomingDeadlines, taskLists, setTaskLists,
    homepageWidgets, isEditingDashboard, setIsEditingDashboard, saveWidgetLayout,
    toast, showToast, closeToast
  };
}
