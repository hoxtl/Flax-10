/*
 * State and handlers for the create-task quick-add bar.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { getModules, getEnrollments } from "../../../api/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import { getUserSettings } from "../../../api/userApi";
import { POMODORO_BLOCK_MINUTES, runQuickAdd } from "../utils/createTaskBarUtils";
import { isReadingList as isReadingTaskList } from "../utils/readingListUtils";

function useCreateTaskBarFormState(lists, defaultListId) {
  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [lists]
  );
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(POMODORO_BLOCK_MINUTES);
  const [taskListId, setTaskListId] = useState(() => defaultListId || "");
  const [moduleId, setModuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [sleepSettings, setSleepSettings] = useState(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);
  const [pageCount, setPageCount] = useState(null);
  const [listError, setListError] = useState(false);
  return { sortedLists, title, setTitle, estimatedMinutes, setEstimatedMinutes, taskListId, setTaskListId, moduleId, setModuleId, saving, setSaving, inputFocused, setInputFocused, enrolledModules, setEnrolledModules, sleepSettings, setSleepSettings, inputRef, cardRef, sleepWarning, checkSleepAndRun, sleepWarningProps, pageCount, setPageCount, listError, setListError };
}

function buildSleepSettings(data) {
  return {
    sleep_time: data?.sleep_time?.slice(0, 5) || "23:00",
    wake_time: data?.wake_time?.slice(0, 5) || "07:00",
  };
}

function getFallbackSleepSettings() {
  return { sleep_time: "23:00", wake_time: "07:00" };
}

function getFirstSortedListId(sortedLists) {
  return sortedLists[0] ? String(sortedLists[0].id) : "";
}

function getSyncedTaskListId(previousValue, defaultListId, setListError) {
  const nextValue = previousValue === defaultListId ? previousValue : defaultListId;
  if (nextValue !== previousValue) setListError?.(false);
  return nextValue;
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
    const applySettings = (settings) => {
      if (!cancelled) setSleepSettings(settings);
    };
    getUserSettings()
      .then((data) => applySettings(buildSleepSettings(data)))
      .catch(() => applySettings(getFallbackSleepSettings()));
    return () => {
      cancelled = true;
    };
  }, [setSleepSettings]);
}

function syncTaskListId(defaultListId, sortedLists, setTaskListId, setListError) {
  if (defaultListId) {
    setTaskListId((previousValue) => getSyncedTaskListId(previousValue, defaultListId, setListError));
    return;
  }
  const firstListId = getFirstSortedListId(sortedLists);
  if (firstListId) setTaskListId((previousValue) => previousValue || firstListId);
}

function useTaskListIdSync(defaultListId, sortedLists, setTaskListId, setListError) {
  useEffect(() => {
    syncTaskListId(defaultListId, sortedLists, setTaskListId, setListError);
  }, [defaultListId, sortedLists, setTaskListId, setListError]);
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

function reportMissingList(state, onError) {
  state.setListError(true);
  onError?.("Please select a list before adding a task.");
}

async function submitQuickAdd(event, state, defaultDueDate, onAddTask, onError) {
  event?.preventDefault();
  const taskTitle = state.title.trim();
  if (!taskTitle || state.saving || !onAddTask) return;
  if (!state.taskListId) return reportMissingList(state, onError);
  state.setListError(false);
  if (defaultDueDate) return state.checkSleepAndRun(defaultDueDate, () => runQuickAdd(state, onAddTask, taskTitle));
  await runQuickAdd(state, onAddTask, taskTitle);
}

function useCreateTaskBarHandlers(state, defaultDueDate, onAddTask, onError) {
  const handleSubmit = async (event) => {
    await submitQuickAdd(event, state, defaultDueDate, onAddTask, onError);
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
  const { lists = [], defaultListId, defaultDueDate, onAddTask, onError, inputRef: externalInputRef } = props;
  const state = useCreateTaskBarFormState(lists, defaultListId);
  useEnrolledModulesEffect(state.setEnrolledModules);
  useSleepSettingsEffect(state.setSleepSettings);
  useTaskListIdSync(defaultListId, state.sortedLists, state.setTaskListId, state.setListError);
  useClickOutsideEffect(state.inputFocused, state.cardRef, state.inputRef, externalInputRef, state.setInputFocused);
  const { handleSubmit } = useCreateTaskBarHandlers(state, defaultDueDate, onAddTask, onError);
  const { handleInputBlur, handleInputKeyDown } = useCreateTaskBarInputHandlers(state);
  const { moduleOptions, listOptions } = useCreateTaskBarOptions(state);
  const selectedList = state.sortedLists.find((list) => String(list.id) === String(state.taskListId));
  return { ...state, handleSubmit, handleInputBlur, handleInputKeyDown, showOptions: state.inputFocused, moduleOptions, listOptions, isReadingList: isReadingTaskList(selectedList) };
}
