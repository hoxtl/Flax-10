/*
 * State and handlers for the create-task quick-add bar.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { getModules, getEnrollments } from "../../../api/modules/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import { getUserSettings } from "../../../api/user/userApi";
import { runQuickAdd } from "../utils/createTaskBarUtils";
import { isReadingList as isReadingTaskList } from "../utils/readingListUtils";

function useCreateTaskBarFormState(lists, defaultListId, defaultDueDate) {
  const sortedLists = useMemo(
    () => [...(lists || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [lists]
  );
  const [title, setTitle] = useState("");
  const [estimatedBlocks, setEstimatedBlocks] = useState(1);
  const [taskListId, setTaskListId] = useState(() => (defaultListId || sortedLists[0]?.id) ?? "");
  const [moduleId, setModuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [sleepSettings, setSleepSettings] = useState(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);
  const [pageCount, setPageCount] = useState(null);
  return { sortedLists, title, setTitle, estimatedBlocks, setEstimatedBlocks, taskListId, setTaskListId, moduleId, setModuleId, saving, setSaving, inputFocused, setInputFocused, enrolledModules, setEnrolledModules, sleepSettings, setSleepSettings, inputRef, cardRef, sleepWarning, checkSleepAndRun, sleepWarningProps, defaultListId, defaultDueDate, pageCount, setPageCount };
}

function useEnrolledModulesEffect(setEnrolledModules) {
  useEffect(() => {
    Promise.all([getModules(), getEnrollments()])
      .then(([modulesList, enrollments]) => {
        const enrolled = (modulesList || []).filter((m) => isEnrolledIn(m.id, enrollments || []));
        setEnrolledModules(enrolled);
      })
      .catch(() => setEnrolledModules([]));
  }, [setEnrolledModules]);
}

function useSleepSettingsEffect(setSleepSettings) {
  useEffect(() => {
    let cancelled = false;
    getUserSettings()
      .then((data) => {
        if (cancelled) return;
        setSleepSettings({
          sleep_time: data?.sleep_time?.slice(0, 5) || "23:00",
          wake_time: data?.wake_time?.slice(0, 5) || "07:00",
        });
      })
      .catch(() => {
        if (!cancelled) setSleepSettings({ sleep_time: "23:00", wake_time: "07:00" });
      });
    return () => { cancelled = true; };
  }, [setSleepSettings]);
}

function useTaskListIdSync(defaultListId, sortedLists, setTaskListId) {
  useEffect(() => {
    const next = (defaultListId || sortedLists[0]?.id) ?? "";
    if (!next) return;
    setTaskListId((prev) => (prev === next ? prev : next));
  }, [defaultListId, sortedLists, setTaskListId]);
}

function useClickOutsideEffect(inputFocused, cardRef, inputRef, externalInputRef, setInputFocused) {
  useEffect(() => {
    if (!inputFocused) return;
    const handleDown = (e) => {
      if (!cardRef.current?.contains(e.target)) {
        setInputFocused(false);
        (externalInputRef?.current || inputRef.current)?.blur?.();
      }
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
    };
  }, [inputFocused, cardRef, inputRef, externalInputRef, setInputFocused]);
}

function useCreateTaskBarHandlers(state, onAddTask) {
  const doAdd = (taskTitle) => runQuickAdd(state, onAddTask, taskTitle);
  const handleSubmit = async (event) => {
    event?.preventDefault();
    const title = state.title.trim();
    if (!title || state.saving || !onAddTask) return;
    if (state.defaultDueDate) state.checkSleepAndRun(state.defaultDueDate, () => doAdd(title));
    else await doAdd(title);
  };
  return { handleSubmit };
}

function useCreateTaskBarInputHandlers(state) {
  const handleInputBlur = () => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (!activeEl?.closest?.("[data-create-task-bar-card]")) state.setInputFocused(false);
    }, 0);
  };
  const handleInputKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      state.setInputFocused(false);
      event.currentTarget.blur();
    }
  };
  return { handleInputBlur, handleInputKeyDown };
}

function useCreateTaskBarOptions(state) {
  const moduleOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...state.enrolledModules.map((m) => ({
        value: String(m.id),
        label: (m.module_code || "") + (m.module_name ? ` — ${m.module_name}` : ""),
      })),
    ],
    [state.enrolledModules]
  );
  const listOptions = useMemo(
    () => state.sortedLists.map((l) => ({ value: String(l.id), label: l.name || "Unnamed list" })),
    [state.sortedLists]
  );
  return { moduleOptions, listOptions };
}

export default function useCreateTaskBar(props) {
  const { lists = [], defaultListId, defaultDueDate, onAddTask, inputRef: externalInputRef } = props;
  const state = useCreateTaskBarFormState(lists, defaultListId, defaultDueDate);
  useEnrolledModulesEffect(state.setEnrolledModules);
  useSleepSettingsEffect(state.setSleepSettings);
  useTaskListIdSync(state.defaultListId, state.sortedLists, state.setTaskListId);
  useClickOutsideEffect(state.inputFocused, state.cardRef, state.inputRef, externalInputRef, state.setInputFocused);
  const { handleSubmit } = useCreateTaskBarHandlers(state, onAddTask);
  const { handleInputBlur, handleInputKeyDown } = useCreateTaskBarInputHandlers(state);
  const { moduleOptions, listOptions } = useCreateTaskBarOptions(state);
  const selectedList = state.sortedLists.find(l => String(l.id) === (state.taskListId));  
  return { ...state, handleSubmit, handleInputBlur, handleInputKeyDown, showOptions: state.inputFocused, moduleOptions, listOptions, isReadingList: isReadingTaskList(selectedList) };
}
