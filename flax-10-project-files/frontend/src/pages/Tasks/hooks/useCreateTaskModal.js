/*
 * State and handlers for the create or edit task modal.
 */

import { useState, useMemo, useEffect } from "react";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import { getUserSettings } from "../../../api/userApi";
import { getModules, getEnrollments } from "../../../api/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import { getListColor } from "../utils/listColorUtils";
import { runCreateTaskSave } from "../utils/createTaskModalUtils";
import { isReadingList } from "../utils/readingListUtils";

const ALLOWED_PRIORITIES = new Set(["medium", "high", "urgent"]);

function getInitialForm(initialTask, defaultListId, defaultDueDate, sortedLists) {
  const task = initialTask || {};
  const taskDue = task.due_date ? String(task.due_date).slice(0, 16) : "";
  const taskModuleId = task.module_id ?? task.module ?? task.moduleId ?? "";
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    priority: ALLOWED_PRIORITIES.has(task.priority) ? task.priority : "",
    due_date: taskDue || (defaultDueDate ?? ""),
    task_list: String(task.task_list ?? defaultListId ?? sortedLists[0]?.id ?? ""),
    estimated_blocks: task.estimated_blocks ?? 1,
    module: taskModuleId ? String(taskModuleId) : "",
    page_count: task.page_count ?? null,
  };
}

function useAvailableModules(modules = []) {
  const [loadedModules, setLoadedModules] = useState([]);
  useEffect(() => {
    if (modules.length > 0) return;
    let cancelled = false;
    Promise.all([getModules(), getEnrollments()])
      .then(([moduleList, enrollments]) => {
        if (cancelled) return;
        const enrolled = (moduleList || []).filter((m) => isEnrolledIn(m.id, enrollments || []));
        setLoadedModules(enrolled);
      })
      .catch(() => { if (!cancelled) setLoadedModules([]); });
    return () => { cancelled = true; };
  }, [modules]);
  const availableModules = modules.length > 0 ? modules : loadedModules;
  return useMemo(() => [...availableModules].sort((a, b) => (a.module_code || "").localeCompare(b.module_code || "")), [availableModules]);
}

function useCreateTaskModalFormState(props) {
  const { lists = [], defaultListId, defaultDueDate, modules, initialTask, newListIdCreated } = props;
  const sortedLists = useMemo(() => [...lists].sort((a, b) => (a.name || "").localeCompare(b.name || "")), [lists]);
  const sortedModules = useAvailableModules(modules);
  const [form, setForm] = useState(() => getInitialForm(initialTask, defaultListId, defaultDueDate, sortedLists));
  const [addToSchedule, setAddToSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (!newListIdCreated) return;
    queueMicrotask(() => setForm((prev) => ({ ...prev, task_list: String(newListIdCreated) })));
  }, [newListIdCreated]);
  return { form, setForm, addToSchedule, setAddToSchedule, saving, setSaving, saveError, setSaveError, sortedLists, sortedModules };
}

function useCreateTaskModalSleep() {
  const [sleepSettings, setSleepSettings] = useState(null);
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);
  useEffect(() => {
    let cancelled = false;
    getUserSettings().then((data) => { if (!cancelled) setSleepSettings({ sleep_time: data?.sleep_time?.slice(0, 5) || "23:00", wake_time: data?.wake_time?.slice(0, 5) || "07:00" }); }).catch(() => { if (!cancelled) setSleepSettings({ sleep_time: "23:00", wake_time: "07:00" }); });
    return () => { cancelled = true; };
  }, []);
  return { sleepSettings, sleepWarning, checkSleepAndRun, sleepWarningProps };
}

function useCreateTaskModalDerived(form, sortedLists, onOpenCreateList) {
  const categoryOptions = useMemo(() => [...sortedLists.map((l) => ({ value: String(l.id), label: l.name })), ...(onOpenCreateList ? [{ value: "__new_list__", label: "+ New List" }] : [])], [sortedLists, onOpenCreateList]);
  const selectedList = useMemo(() => sortedLists.find((l) => String(l.id) === String(form.task_list)), [sortedLists, form.task_list]);
  const selectedListColor = selectedList ? getListColor(selectedList, sortedLists.indexOf(selectedList)) : null;
  const readingList = isReadingList(selectedList);
  const estimatedReadingMinutes = useMemo(() => {
    if (!readingList || !form.page_count) return null;
    return Math.round(Number(form.page_count) * 2);
  }, [readingList, form.page_count]);
  return { categoryOptions, selectedList, selectedListColor, isReadingList: readingList, estimatedReadingMinutes };
}

function useCreateTaskModalHandlers(props, formState, sleepState) {
  const { form, setForm, addToSchedule, saving, setSaving, setSaveError } = formState;
  const { onSave, onClose, onOpenCreateList, showAddToScheduleToggle, mode, onDeleteTask } = props;
  const { checkSleepAndRun } = sleepState;
  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const doSave = () => runCreateTaskSave(form, addToSchedule, mode, showAddToScheduleToggle, onSave, onClose, setSaveError);
  const handleSave = () => { if (!form.title.trim() || !form.due_date || saving) return; checkSleepAndRun(form.due_date, async () => { setSaving(true); try { await doSave(); } finally { setSaving(false); } }); };
  const handleKey = (e) => { if (e.key === "Escape") onClose(); };
  const handleDelete = async () => { if (!onDeleteTask) return; setSaving(true); try { await onDeleteTask(); onClose(); } finally { setSaving(false); } };
  const handleCategoryChange = (v) => { if (v === "__new_list__") { onOpenCreateList?.(); return; } setForm((p) => ({ ...p, task_list: v })); };
  return { set, doSave, handleSave, handleKey, handleDelete, handleCategoryChange };
}

/* State and handlers for CreateTaskModal. */
export function useCreateTaskModal(props) {
  const formState = useCreateTaskModalFormState(props);
  const sleepState = useCreateTaskModalSleep();
  const derived = useCreateTaskModalDerived(formState.form, formState.sortedLists, props.onOpenCreateList);
  const handlers = useCreateTaskModalHandlers(props, formState, sleepState);
  return {
    ...formState,
    ...derived,
    ...sleepState,
    ...handlers,
    isEditMode: props.mode === "edit",
    onClose: props.onClose,
    onOpenCreateList: props.onOpenCreateList,
    showAddToScheduleToggle: props.showAddToScheduleToggle,
    mode: props.mode,
    onDeleteTask: props.onDeleteTask,
  };
}
