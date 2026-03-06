/**
 * CreateTaskModal.jsx
 *
 * Modal for creating a new task. Provides a lightweight, canvas-style form with
 * borderless inputs, priority and study-block chips, and optional due date.
 * When onOpenCreateList is provided, the Category dropdown shows "+ New List" and
 * opens the same Create List modal used in the list sidebar.
 */

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

import DateTimePicker from "./DateTimePicker";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import EstTimeHelpBanner from "../../../components/ui/EstTimeHelpBanner";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./CreateTaskModal.module.css";

const PRIORITY_OPTIONS = [
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
const ALLOWED_PRIORITIES = new Set(PRIORITY_OPTIONS.map((p) => p.value));

const STUDY_BLOCK_OPTIONS = [
  { value: 1, label: "25m" },
  { value: 2, label: "50m" },
  { value: 3, label: "1h 15m" },
  { value: 4, label: "1h 40m" },
];

const FALLBACK_COLOURS = FOCUS_BLOCK_COLOURS_HEX;

/**
 * Resolves display colour for a task list (stored colour or fallback by index).
 * @param {Object} list - Task list object (may have .color, .id).
 * @param {number} idx - Index in the lists array for fallback.
 * @returns {string} Hex colour.
 */
function getListColor(list, idx) {
  if (list?.color) return list.color;
  try {
    if (list?.id && typeof window !== "undefined") {
      const s = localStorage.getItem("listColor:" + list.id);
      if (s) return s;
    }
  } catch {
    // Ignore localStorage access issues and use fallback colors.
  }
  return FALLBACK_COLOURS[idx % FALLBACK_COLOURS.length];
}

/**
 * Create Task modal. Public props: lists, defaultListId, onSave, onClose.
 * Optional: onOpenCreateList — when provided, Category dropdown shows "+ New List" and opens the Create List modal (same as sidebar).
 * Optional: newListIdCreated — when set (after creating a list from that modal), form category is set to this list.
 * Optional: showAddToScheduleToggle, addToScheduleLabel, modules.
 */
export default function CreateTaskModal({
  lists,
  defaultListId,
  defaultDueDate,
  onSave,
  onClose,
  onOpenCreateList,
  newListIdCreated,
  showAddToScheduleToggle = false,
  addToScheduleLabel = "Add to today's schedule",
  modules = [],
  mode = "create",
  initialTask = null,
  onDeleteTask,
}) {
  const sortedLists = useMemo(
    () => [...(lists || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [lists]
  );
  const sortedModules = useMemo(
    () => [...(modules || [])].sort((a, b) => (a.module_code || "").localeCompare(b.module_code || "")),
    [modules]
  );
  const [form, setForm] = useState(() => {
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
    };
  });
  const [addToSchedule, setAddToSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const categoryOptions = useMemo(
    () => [
      ...sortedLists.map((l) => ({ value: String(l.id), label: l.name })),
      ...(onOpenCreateList ? [{ value: "__new_list__", label: "+ New List" }] : []),
    ],
    [sortedLists, onOpenCreateList]
  );

  useEffect(() => {
    if (newListIdCreated) setForm((p) => ({ ...p, task_list: String(newListIdCreated) }));
  }, [newListIdCreated]);

  const selectedList = useMemo(
    () => sortedLists.find((l) => String(l.id) === String(form.task_list)),
    [sortedLists, form.task_list]
  );
  const selectedListColor = selectedList
    ? getListColor(selectedList, sortedLists.indexOf(selectedList))
    : null;

  const askFlaxInitialMessage = useMemo(() => {
    const title = (form.title || "").trim();
    if (!title) {
      return "Help me estimate how long this task might take — what time block should I pick?";
    }
    return `Help me estimate how long "${title}" might take and which focus block I should pick.`;
  }, [form.title]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.due_date) return;
    setSaveError("");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description || "",
      priority: form.priority || "medium",
      due_date: form.due_date,
      task_list: form.task_list ? Number(form.task_list) : null,
      estimated_blocks: Math.max(1, Number(form.estimated_blocks) || 1),
      module: form.module ? Number(form.module) : null,
    };
    try {
      if (mode === "create" && showAddToScheduleToggle) {
        await onSave(payload, { addToSchedule });
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setSaveError(err?.message || "Couldn’t save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
  };

  const handleDelete = async () => {
    if (!onDeleteTask) return;
    setSaving(true);
    try {
      await onDeleteTask();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEditMode = mode === "edit";

  const modal = (
    <div className={styles.overlay} onMouseDown={onClose} onKeyDown={handleKey}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditMode ? "Edit task" : "New task"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.canvas}>
            <label htmlFor="create-task-title" className={styles.label}>Task name <span className={styles.labelRequired}>*</span></label>
            <div className={styles.fieldGroup}>
              <input
                id="create-task-title"
                className={styles.titleInput}
                placeholder="What do you need to do?"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                autoFocus
              />
            </div>
            <label htmlFor="create-task-desc" className={styles.label}>Description</label>
            <div className={styles.fieldGroup}>
              <textarea
                id="create-task-desc"
                className={styles.desc}
                placeholder="Optional"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.timeRow}>
            <div className={styles.dateTimeWrap}>
              <label className={styles.gridLabel}>Due date <span className={styles.labelRequired}>*</span></label>
              <DateTimePicker
                value={form.due_date}
                onChange={(val) => set("due_date", val)}
                placeholder="Select due date"
              />
            </div>
          </div>
          <div className={styles.durationRow}>
            <EstTimeHelpBanner
              message="Not sure what estimated time to put? Ask Flax for a suggestion."
              ctaLabel="Ask Flax"
              initialMessage={askFlaxInitialMessage}
              className={styles.estTimeBannerModal}
            />
            <span className={styles.focusBlocksLabel}>Est. time</span>
            <div className={styles.chipGroup}>
              {STUDY_BLOCK_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.chip} ${form.estimated_blocks === value ? styles.chipActive : ""}`}
                  onClick={() => setForm((p) => ({ ...p, estimated_blocks: value }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingsStack}>
            <div className={styles.settingRow}>
              <div className={styles.listWrap}>
                <span className={styles.listWrapLabel}>Category</span>
                {selectedListColor && (
                  <span className={styles.listDot} style={{ background: selectedListColor }} />
                )}
                <div className={styles.listDropdownTriggerWrap}>
                  <AnimatedDropdown
                    value={form.task_list ? String(form.task_list) : ""}
                    onChange={(v) => {
                      if (v === "__new_list__") {
                        onOpenCreateList?.();
                        return;
                      }
                      setForm((p) => ({ ...p, task_list: v }));
                    }}
                    placeholder="Select list"
                    options={categoryOptions}
                    menuMaxHeight={420}
                    className={styles.listAnimatedDropdown}
                  />
                </div>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.rowBlock}>
                <span className={styles.rowLabel}>Priority</span>
                <div className={`${styles.chipGroup} ${styles.chipGroupSingleRow}`}>
                  {PRIORITY_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.chip} ${form.priority === value ? styles.chipActive : ""}`}
                      onClick={() => set("priority", form.priority === value ? "" : value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {sortedModules.length > 0 && (
            <div className={styles.row}>
              <div className={styles.listWrap} style={{ width: "100%" }}>
                <span className={styles.listWrapLabel}>Link to module</span>
                <AnimatedDropdown
                  value={form.module ? String(form.module) : ""}
                  onChange={(val) => set("module", val)}
                  placeholder="No module"
                  options={[
                    { value: "", label: "No module" },
                    ...sortedModules.map((m) => ({
                      value: String(m.id),
                      label: `${m.module_code} – ${m.module_name || m.title || ""}`,
                    })),
                  ]}
                />
              </div>
            </div>
          )}

          {mode === "create" && showAddToScheduleToggle && (
            <div className={styles.scheduleRow}>
              <label className={styles.scheduleLabel}>
                <input
                  type="checkbox"
                  checked={addToSchedule}
                  onChange={(e) => setAddToSchedule(e.target.checked)}
                  className={styles.scheduleCheckbox}
                />
                <span>{addToScheduleLabel}</span>
              </label>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {saveError && (
            <p className={styles.saveError} role="alert">{saveError}</p>
          )}
          {isEditMode && onDeleteTask && (
            <button type="button" className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
              Delete task
            </button>
          )}
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.due_date}
          >
            {saving ? "Saving…" : (isEditMode ? "Save" : "Add task")}
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
