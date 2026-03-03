/**
 * Quick Capture bar: two rows.
 *   Row 1: task name input + Add button (primary action)
 *   Row 2: Est. time chips + Module chip + List selector (secondary options)
 * For full planning (calendar, deadline, travel time) use the "Full Planning" button.
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

import { getModules, getEnrollments } from "../../../api/moduleApi";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";

import styles from "./CreateTaskBar.module.css";

const DURATION_OPTIONS = [
  { value: 0, label: "5m", ariaLabel: "5 minutes (quick task)" },
  { value: 1, label: "25m", ariaLabel: "25 minutes (1 Pomodoro block)" },
  { value: 2, label: "50m", ariaLabel: "50 minutes (2 Pomodoro blocks)" },
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
  const [inputFocused, setInputFocused] = useState(false);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const popoverRef = useRef(null);
  const listDropdownRef = useRef(null);
  const listTriggerRef = useRef(null);
  const moduleTriggerRef = useRef(null);
  const [listPopoverRect, setListPopoverRect] = useState(null);
  const [modulePopoverRect, setModulePopoverRect] = useState(null);

  const updateListPopoverRect = useCallback(() => {
    if (!listTriggerRef.current) return;
    const r = listTriggerRef.current.getBoundingClientRect();
    setListPopoverRect({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 160) });
  }, []);
  const updateModulePopoverRect = useCallback(() => {
    if (!moduleTriggerRef.current) return;
    const r = moduleTriggerRef.current.getBoundingClientRect();
    setModulePopoverRect({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 160) });
  }, []);

  useEffect(() => {
    if (listDropdownOpen) {
      updateListPopoverRect();
      const onResize = () => updateListPopoverRect();
      window.addEventListener("scroll", updateListPopoverRect, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", updateListPopoverRect, true);
        window.removeEventListener("resize", onResize);
      };
    } else {
      setListPopoverRect(null);
    }
  }, [listDropdownOpen, updateListPopoverRect]);

  useEffect(() => {
    if (modulePopoverOpen) {
      updateModulePopoverRect();
      const onResize = () => updateModulePopoverRect();
      window.addEventListener("scroll", updateModulePopoverRect, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", updateModulePopoverRect, true);
        window.removeEventListener("resize", onResize);
      };
    } else {
      setModulePopoverRect(null);
    }
  }, [modulePopoverOpen, updateModulePopoverRect]);

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
  const showOptions = inputFocused || modulePopoverOpen || listDropdownOpen;

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      {/* Row 1: primary — task name + Add */}
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              const activeEl = document.activeElement;
              const insideForm = activeEl && activeEl.closest && activeEl.closest(`.${styles.card}`);
              if (!insideForm && !modulePopoverOpen && !listDropdownOpen) setInputFocused(false);
            }, 0);
          }}
          aria-label="Task name"
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={saving || !title.trim()}
          aria-label="Add task"
        >
          {saving ? "…" : "Add"}
        </button>
      </div>

      {/* Row 2: secondary options — est. time, module, list */}
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

        <div className={styles.moduleWrap} ref={popoverRef}>
          <button
            ref={moduleTriggerRef}
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
            <div
              className={styles.modulePopover}
              style={
                modulePopoverRect
                  ? {
                      position: "fixed",
                      top: modulePopoverRect.top,
                      left: modulePopoverRect.left,
                      minWidth: modulePopoverRect.width,
                    }
                  : undefined
              }
            >
              <div className={styles.moduleDropdownList} role="listbox" aria-label="Module">
                <button
                  type="button"
                  role="option"
                  aria-selected={!moduleId}
                  className={`${styles.moduleDropdownItem} ${!moduleId ? styles.moduleDropdownItemActive : ""}`}
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
                    role="option"
                    aria-selected={String(moduleId) === String(m.id)}
                    className={`${styles.moduleDropdownItem} ${String(moduleId) === String(m.id) ? styles.moduleDropdownItemActive : ""}`}
                    onClick={() => {
                      setModuleId(m.id);
                      setModulePopoverOpen(false);
                    }}
                  >
                    <span className={styles.moduleDropdownCode}>{m.module_code}</span>
                    {m.module_name && (
                      <span className={styles.moduleDropdownName}>{m.module_name}</span>
                    )}
                  </button>
                ))}
              </div>
              {enrolledModules.length === 0 && (
                <p className={styles.modulePopoverEmpty}>No enrolled modules</p>
              )}
            </div>
          )}
        </div>

        <span className={styles.optionsRowDivider} aria-hidden />
        <span className={styles.optionsRowLabel}>List</span>

        <div className={styles.listDropdownWrap} ref={listDropdownRef}>
          {(() => {
            const activeList = sortedLists.find((l) => String(l.id) === String(taskListId));
            return (
              <>
                <button
                  ref={listTriggerRef}
                  type="button"
                  className={styles.listDropdownTrigger}
                  onClick={() => setListDropdownOpen((o) => !o)}
                  aria-label="Select list"
                  aria-expanded={listDropdownOpen}
                  aria-haspopup="listbox"
                >
                  {activeList?.color && (
                    <span
                      className={styles.listDot}
                      style={{ background: activeList.color }}
                      aria-hidden
                    />
                  )}
                  <span className={styles.listDropdownValue}>
                    {activeList?.name || "Select list"}
                  </span>
                  <span className={styles.listDropdownChevron} aria-hidden>▾</span>
                </button>
                {listDropdownOpen && (
                  <div
                    className={styles.listDropdownPopover}
                    role="listbox"
                    aria-label="List"
                    style={
                      listPopoverRect
                        ? {
                            position: "fixed",
                            top: listPopoverRect.top,
                            left: listPopoverRect.left,
                            minWidth: listPopoverRect.width,
                          }
                        : undefined
                    }
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
                        {l.color && (
                          <span
                            className={styles.listDot}
                            style={{ background: l.color }}
                            aria-hidden
                          />
                        )}
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </form>
  );
}
