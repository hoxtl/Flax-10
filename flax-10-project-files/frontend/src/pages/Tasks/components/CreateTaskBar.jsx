/**
 * Quick Capture bar: two rows.
 *   Row 1: task name input + Add button (primary action)
 *   Row 2: Est. time chips + Module chip + List selector (secondary options)
 * For full planning (calendar, deadline, travel time) use the "Full Planning" button.
 */
import { useState, useMemo, useEffect, useRef } from "react";

import { getModules, getEnrollments } from "../../../api/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import { SleepWarningModal } from "../../../components/common/SleepWarningModal";
import { useSleepWarning } from "../../../components/Settings/hooks/useSleepWarning";
import { getUserSettings } from "../../../api/userService";

import styles from "./CreateTaskBar.module.css";

const DURATION_OPTIONS = [
  { value: 1, label: "25m", ariaLabel: "25 minutes (1 Pomodoro block)" },
  { value: 2, label: "50m", ariaLabel: "50 minutes (2 Pomodoro blocks)" },
];

export default function CreateTaskBar({ lists = [], defaultListId, defaultDueDate, onAddTask, inputRef: externalInputRef }) {
  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [lists]
  );
  const [title, setTitle] = useState("");
  const [estimatedBlocks, setEstimatedBlocks] = useState(1);
  const [taskListId, setTaskListId] = useState(
      () => (defaultListId || sortedLists[0]?.id) ?? ""
    );
  const [moduleId, setModuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [sleepSettings, setSleepSettings] = useState(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  const { sleepWarning, checkSleepAndRun, sleepWarningProps } = useSleepWarning(sleepSettings);

  useEffect(() => {
    Promise.all([getModules(), getEnrollments()])
      .then(([modulesList, enrollments]) => {
        const enrolled = (modulesList || []).filter((m) =>
          isEnrolledIn(m.id, enrollments || [])
        );
        setEnrolledModules(enrolled);
      })
      .catch(() => setEnrolledModules([]));
  }, []);

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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const next = (defaultListId || sortedLists[0]?.id) ?? "";
    if (!next) return;
    setTaskListId((prev) => (prev === next ? prev : next));
  }, [defaultListId, sortedLists.length, sortedLists[0]?.id]);

  useEffect(() => {
    if (!inputFocused) return;
    const handleDown = (e) => {
      if (!cardRef.current) return;
      if (!cardRef.current.contains(e.target)) {
        setInputFocused(false);
        const inp = externalInputRef?.current || inputRef.current;
        inp?.blur?.();
      }
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
    };
  }, [inputFocused, externalInputRef]);

  const doAdd = async (taskTitle) => {
    if (saving || !onAddTask) return;
    setSaving(true);
    try {
      await onAddTask({
        title: taskTitle,
        description: "",
        priority: "medium",
        energy_level: "",
        due_date: defaultDueDate ?? null,
        task_list: taskListId ? Number(taskListId) : (sortedLists[0]?.id ?? null),
        estimated_blocks: estimatedBlocks,
        module: moduleId ? Number(moduleId) : null,
      });
      setTitle("");
      setModuleId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const t = title.trim();
    if (!t || saving || !onAddTask) return;
    if (defaultDueDate) {
      checkSleepAndRun(defaultDueDate, () => doAdd(t));
      return;
    }
    await doAdd(t);
  };

  const showOptions = inputFocused;

  const moduleOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...enrolledModules.map((m) => ({
        value: String(m.id),
        label: (m.module_code || "") + (m.module_name ? ` — ${m.module_name}` : ""),
      })),
    ],
    [enrolledModules]
  );
  const listOptions = useMemo(
    () => sortedLists.map((l) => ({ value: String(l.id), label: l.name || "Unnamed list" })),
    [sortedLists]
  );

  return (
    <>
    <form className={styles.card} onSubmit={handleSubmit} ref={cardRef}>
      <div className={styles.inputRow}>
        <input
          ref={externalInputRef ?? inputRef}
          type="text"
          className={styles.input}
          placeholder="Quick add: what needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              const activeEl = document.activeElement;
              const insideForm = activeEl && activeEl.closest && activeEl.closest(`.${styles.card}`);
              if (!insideForm) setInputFocused(false);
            }, 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setInputFocused(false);
              e.currentTarget.blur();
            }
          }}
          aria-label="Quick add task"
        />
        {title.trim() && (
          <button
            type="submit"
            className={styles.addBtn}
            disabled={saving || !title.trim()}
            aria-label="Add task"
          >
            {saving ? "…" : "Add"}
          </button>
        )}
      </div>

      {/* Row 2: secondary options — est. time, module, list */}
      <div className={styles.optionsRowWrapper}>
        <div className={`${styles.optionsRow} ${showOptions ? styles.optionsRowOpen : ""}`}>
        <span className={styles.optionsRowLabel}>Est. time</span>
        <div className={styles.durationGroup} role="group" aria-label="Estimated duration">
          {DURATION_OPTIONS.map(({ value, label, ariaLabel }) => (
            <button
              key={value}
              type="button"
              className={`${styles.durationBtn} ${estimatedBlocks === value ? styles.durationBtnActive : ""}`}
              onClick={() => setEstimatedBlocks(value)}
              aria-label={ariaLabel}
              aria-pressed={estimatedBlocks === value}
            >
              {label}
            </button>
          ))}
        </div>

        <span className={styles.optionsRowDivider} aria-hidden />

        <span className={styles.optionsRowLabel}>Module</span>
        <div className={`${styles.dropdownWrap} ${styles.moduleDropdownWrap}`}>
          <AnimatedDropdown
            value={moduleId ?? ""}
            onChange={(v) => setModuleId(v === "" ? null : v)}
            placeholder="Module"
            options={moduleOptions}
            className={styles.moduleListDropdown}
          />
        </div>

        <span className={styles.optionsRowDivider} aria-hidden />
        <span className={styles.optionsRowLabel}>List</span>

        <div className={`${styles.dropdownWrap} ${styles.listDropdownWrap}`}>
          <AnimatedDropdown
            value={taskListId || ""}
            onChange={(v) => setTaskListId(v || (sortedLists[0]?.id ?? ""))}
            placeholder="Select list"
            options={listOptions}
            className={styles.moduleListDropdown}
          />
        </div>
        </div>
      </div>
    </form>
    {sleepWarning && <SleepWarningModal {...sleepWarningProps} />}
    </>
  );
}
