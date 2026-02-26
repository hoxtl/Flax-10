/**
 * Quick Capture bar: task name only (optional duration/list/module).
 * For full planning (calendar, module, travel time) use the "Full Planning" button.
 */
import { useState, useMemo, useEffect, useRef } from "react";

import { getModules, getEnrollments } from "../../../api/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";

import styles from "./CreateTaskBar.module.css";

const DURATION_OPTIONS = [
  { value: 1, label: "25m", ariaLabel: "25 minutes" },
  { value: 2, label: "50m", ariaLabel: "50 minutes" },
];

export default function CreateTaskBar({ lists = [], defaultListId, defaultDueDate, onAddTask }) {
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
  const [modulePopoverOpen, setModulePopoverOpen] = useState(false);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const popoverRef = useRef(null);
  const listDropdownRef = useRef(null);

  useEffect(() => {
    if (!listDropdownOpen) return;
    const close = (e) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(e.target))
        setListDropdownOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [listDropdownOpen]);

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
    const next = (defaultListId || sortedLists[0]?.id) ?? "";
    if (!next) return;
    setTaskListId((prev) => (prev === next ? prev : next));
  }, [defaultListId, sortedLists.length, sortedLists[0]?.id]);

  useEffect(() => {
    if (!modulePopoverOpen) return;
    const close = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target))
        setModulePopoverOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [modulePopoverOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const t = title.trim();
    if (!t || saving || !onAddTask) return;
    setSaving(true);
    try {
      await onAddTask({
        title: t,
        description: "",
        priority: "medium",
        due_date: defaultDueDate ?? null,
        task_list: taskListId || sortedLists[0]?.id,
        estimated_blocks: estimatedBlocks,
        module: moduleId ? Number(moduleId) : null,
      });
      setTitle("");
      setModuleId(null);
    } finally {
      setSaving(false);
    }
  };

  const selectedModule = useMemo(
    () => enrolledModules.find((m) => String(m.id) === String(moduleId)),
    [enrolledModules, moduleId]
  );

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Add a task — task name"
      />
      <div className={styles.actions}>
        <span className={styles.actionLabel} aria-hidden>Duration</span>
        <div className={styles.durationGroup} role="group" aria-label="Duration">
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
        <div className={styles.moduleWrap} ref={popoverRef}>
          <button
            type="button"
            className={`${styles.moduleBtn} ${moduleId ? styles.moduleBtnActive : ""}`}
            onClick={() => setModulePopoverOpen((o) => !o)}
            aria-label="Link to module"
            aria-expanded={modulePopoverOpen}
            aria-haspopup="true"
          >
            📚 {selectedModule ? selectedModule.module_code : "Module"}
          </button>
          {modulePopoverOpen && (
            <div className={styles.modulePopover}>
              <div className={styles.modulePopoverBubbles}>
                <button
                  type="button"
                  className={`${styles.moduleBubble} ${!moduleId ? styles.moduleBubbleActive : ""}`}
                  onClick={() => {
                    setModuleId(null);
                    setModulePopoverOpen(false);
                  }}
                >
                  None
                </button>
                {enrolledModules.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.moduleBubble} ${String(moduleId) === String(m.id) ? styles.moduleBubbleActive : ""}`}
                    onClick={() => {
                      setModuleId(m.id);
                      setModulePopoverOpen(false);
                    }}
                  >
                    {m.module_code}
                  </button>
                ))}
              </div>
              {enrolledModules.length === 0 && (
                <p className={styles.modulePopoverEmpty}>No enrolled modules</p>
              )}
            </div>
          )}
        </div>
        <span className={styles.actionLabel} aria-hidden>List</span>
        <div className={styles.listDropdownWrap} ref={listDropdownRef}>
          <button
            type="button"
            className={styles.listDropdownTrigger}
            onClick={() => setListDropdownOpen((o) => !o)}
            aria-label="Select list"
            aria-expanded={listDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className={styles.listDropdownValue}>
              {sortedLists.find((l) => String(l.id) === String(taskListId))?.name || "Select list"}
            </span>
            <span className={styles.listDropdownChevron} aria-hidden>▾</span>
          </button>
          {listDropdownOpen && (
            <div
              className={styles.listDropdownPopover}
              role="listbox"
              aria-label="List"
            >
              {sortedLists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="option"
                  aria-selected={String(taskListId) === String(l.id)}
                  className={`${styles.listDropdownOption} ${String(taskListId) === String(l.id) ? styles.listDropdownOptionActive : ""}`}
                  onClick={() => {
                    setTaskListId(l.id);
                    setListDropdownOpen(false);
                  }}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="submit"
        className={styles.addBtn}
        disabled={saving || !title.trim()}
        aria-label="Add a task — add task"
      >
        {saving ? "…" : "Add"}
      </button>
    </form>
  );
}
