import { useMemo, useCallback } from "react";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import { isToday, overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { getNavigatorContext, getAllFreeWindowsToday, isRoutineOrEventTask } from "../utils/index";

export function useHomepageDerivations({
  modulesList, enrollments, allCalEvents, selectedDate, now,
  dayEvents, dayTasks, allTasks, taskLists, getTag, upcomingDeadlines
}) {
  const enrolledModules = useMemo(() => (modulesList || []).filter((m) => isEnrolledIn(m.id, enrollments)), [modulesList, enrollments]);

  const tomorrowFirstEvent = useMemo(() => {
    const tmrw = new Date(selectedDate); tmrw.setDate(tmrw.getDate() + 1);
    const evts = (allCalEvents || []).filter(e => e.start_time && overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), tmrw));
    return evts.sort((a,b) => new Date(a.start_time) - new Date(b.start_time))[0] ?? null;
  }, [allCalEvents, selectedDate]);

  const getTaskCategoryPillMeta = useCallback((task) => {
    const listId = task.task_list != null ? String(task.task_list) : null;
    const list = (taskLists || []).find((l) => String(l.id) === listId);
    if (list?.name) return { label: String(list.name).trim().slice(0, 20), listId };
    const modId = task.module_id ?? task.module ?? task.moduleId;
    const mod = (enrolledModules || []).find((m) => String(m.id) === String(modId));
    if (mod) return { label: (mod.module_code || mod.module_name || `M${mod.id}`).toString().trim().slice(0, 8), listId: null };
    if (task.module_code) return { label: String(task.module_code).trim().slice(0, 8), listId: null };
    const tag = getTag?.(task.tag);
    if (tag?.label) return { label: String(tag.label).trim().slice(0, 8), listId: null };
    return null;
  }, [taskLists, enrolledModules, getTag]);

  const getTaskCategoryPill = useCallback((task) => getTaskCategoryPillMeta(task)?.label || null, [getTaskCategoryPillMeta]);

  const getTaskCategoryColor = useCallback((task) => {
    const t = getTag?.(task.tag);
    const lbl = (t?.label || "").toString().toLowerCase();
    return lbl.includes("academic") ? "sage" : lbl.includes("personal") ? "flax" : (task.module_id ?? task.module ?? task.moduleId ?? task.module_code) ? "sage" : "flax";
  }, [getTag]);

  const sortedEvents = useMemo(() => {
    const seen = new Set();
    const meals = ["breakfast", "lunch", "dinner"];
    const deduped = (dayEvents || []).filter((e) => {
      const t = (e.title || "").trim().toLowerCase();
      if (!e.start_time) return true;
      if (meals.includes(t)) {
        const k = `${e.start_time.slice(0,10)}:${t}`;
        if (seen.has(k)) return false;
        seen.add(k);
      }
      return true;
    });
    return deduped.sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
  }, [dayEvents]);

  const pastItems = useMemo(() => sortedEvents.filter((it) => {
    const end = it.end_time || it.start_time;
    return end && new Date(end) < now && !(new Date(it.start_time) <= now && new Date(end) >= now);
  }), [sortedEvents, now]);

  const upcomingItems = useMemo(() => {
    const pIds = new Set(pastItems.map(x=>x.id));
    return sortedEvents.filter((it) => !pIds.has(it.id));
  }, [sortedEvents, pastItems]);

  const pastIdsShownInTimeline = useMemo(() => new Set(pastItems.filter((p) => {
    const pE = new Date(p.end_time || p.start_time);
    return upcomingItems.some((u) => pE > new Date(u.start_time) && new Date(p.start_time) < new Date(u.end_time || u.start_time));
  }).map(p=>p.id)), [pastItems, upcomingItems]);

  const missedItems = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    return pastItems.filter(p => !pastIdsShownInTimeline.has(p.id) && !["module_deadline", "module_enrollment"].includes(String(p.source)));
  }, [selectedDate, pastItems, pastIdsShownInTimeline]);

  const scheduledTitles = useMemo(() => new Set(upcomingItems.map((e) => e.title?.toLowerCase())), [upcomingItems]);
  const suggestableTasks = useMemo(() => (dayTasks || []).filter((t) => !scheduledTitles.has(t.title?.toLowerCase())), [dayTasks, scheduledTitles]);

  const tasksDueToday = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const ds = new Date(selectedDate); ds.setHours(0,0,0,0);
    const de = new Date(selectedDate); de.setHours(23,59,59,999);
    return (allTasks || []).filter(t => { const d = t.due_date ? new Date(t.due_date) : null; return d && d >= ds && d <= de; })
      .sort((a,b) => (b.due_date<now&&!b.completed) - (a.due_date<now&&!a.completed));
  }, [selectedDate, allTasks, now]);

  const navigatorContext = useMemo(() => getNavigatorContext(now, selectedDate, sortedEvents, isToday), [now, selectedDate, sortedEvents]);

  const deadlineSuggestions = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const fDays = 14*86400000;
    const sT = sortedEvents.map(e => (e.title || "").toLowerCase());
    return (upcomingDeadlines || []).filter(d => {
      if (!d.start_due_date) return false;
      const ms = new Date(d.start_due_date).getTime() - now.getTime();
      if (ms <= 0 || ms > fDays) return false;
      const dt = (d.assessment_title || d.title || "").toLowerCase();
      const dc = (d.module_code || "").toLowerCase();
      return !sT.some(t => (dt && t.includes(dt.slice(0,8))) || (dc && t.includes(dc)));
    }).sort((a,b) => new Date(a.start_due_date) - new Date(b.start_due_date));
  }, [selectedDate, upcomingDeadlines, sortedEvents, now]);

  const overdueTasksForNow = useMemo(() => tasksDueToday.filter(t => !isRoutineOrEventTask(t, getTag) && !t.completed && t.due_date && new Date(t.due_date) < now).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)), [tasksDueToday, getTag, now]);

  const taskWidgetList = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const ds = new Date(selectedDate); ds.setHours(0,0,0,0);
    const de = new Date(selectedDate); de.setHours(23,59,59,999);
    const tasks = (allTasks || []).filter(t => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && ((d >= ds && d <= de) || (d < now && !t.completed));
    }).map(t => {
      const d = t.due_date ? new Date(t.due_date) : null;
      const overdue = d && d < now && !t.completed;
      return { type: "task", id: `task-${t.id}`, sortTime: d || de, endTime: d ? new Date(d.getTime()+(t.estimated_blocks||1)*25*60000) : de, isOverdue: overdue, taskWidgetStatus: t.completed ? "completed" : overdue ? "overdue" : "upcoming", ...t };
    });
    const fu = tasks.filter(t => !t.completed && t.sortTime >= now && t.sortTime <= de).sort((a,b) => new Date(a.sortTime)-new Date(b.sortTime))[0];
    if (fu) fu.taskWidgetStatus = "now";
    const ord = { overdue: 0, now: 1, upcoming: 2, completed: 3 };
    return tasks.sort((a,b) => (ord[a.taskWidgetStatus]??2) - (ord[b.taskWidgetStatus]??2));
  }, [selectedDate, allTasks, now]);

  const taskWidgetItemsOnly = useMemo(() => taskWidgetList.filter(i=>i.type==="task"), [taskWidgetList]);
  const taskWidgetDueTodayCount = useMemo(() => tasksDueToday.length, [tasksDueToday]);
  const taskWidgetCompletedCount = useMemo(() => taskWidgetItemsOnly.filter(i=>i.completed).length, [taskWidgetItemsOnly]);
  const taskWidgetSpineCompletedPct = taskWidgetItemsOnly.length ? (taskWidgetCompletedCount/taskWidgetItemsOnly.length)*100 : 0;
  const taskWidgetOverdueCount = useMemo(() => taskWidgetItemsOnly.filter(i=>!i.completed && i.taskWidgetStatus==="overdue").length, [taskWidgetItemsOnly]);

  const todayFreeWindows = useMemo(() => !isToday(selectedDate) ? [] : getAllFreeWindowsToday(sortedEvents, selectedDate).filter(w=>w.minutes>=20).sort((a,b)=>a.start-b.start), [selectedDate, sortedEvents]);

  const freeWindowLabel = useMemo(() => {
    const nw = todayFreeWindows[0];
    if (!nw?.minutes) return null;
    return nw.minutes < 60 ? `${nw.minutes}m` : nw.minutes%60 ? `${Math.floor(nw.minutes/60)}h ${nw.minutes%60}m` : `${Math.floor(nw.minutes/60)}h`;
  }, [todayFreeWindows]);

  const homepageRecommendation = useMemo(() => {
    const pend = taskWidgetItemsOnly.filter((t) => !t.completed);
    const sdl = [...(upcomingDeadlines || [])].filter(d=>d?.start_due_date).sort((a,b)=>new Date(a.start_due_date)-new Date(b.start_due_date));
    const k = (i) => String(i?.module_id ?? i?.module ?? i?.moduleId ?? i?.module_code ?? "").trim().toUpperCase();
    for (const d of sdl) {
      if (!k(d)) continue;
      const t = pend.find(task => k(task) === k(d));
      if (!t) continue;
      const diff = Math.floor((new Date(d.start_due_date).getTime() - now.getTime())/86400000);
      const dl = diff <= 0 ? "due today" : diff === 1 ? "due tomorrow" : `due in ${diff}d`;
      return { text: `Focus on ${t.title} for ${d.assessment_title || d.title || d.module_code || "upcoming deadline"}.`, meta: `${d.module_code || "Module"}${dl ? ` · ${dl}` : ""}` };
    }
    if (pend[0] && freeWindowLabel) return { text: `Use the ${freeWindowLabel} window to move ${pend[0].title} forward.`, meta: "Best task to move next" };
    return null;
  }, [taskWidgetItemsOnly, upcomingDeadlines, freeWindowLabel, now]);

  return { enrolledModules, tomorrowFirstEvent, getTaskCategoryPill, getTaskCategoryColor, sortedEvents, missedItems, suggestableTasks, tasksDueToday, navigatorContext, deadlineSuggestions, overdueTasksForNow, taskWidgetList, taskWidgetItemsOnly, taskWidgetDueTodayCount, taskWidgetSpineCompletedPct, taskWidgetOverdueCount, todayFreeWindows, homepageRecommendation };
}
