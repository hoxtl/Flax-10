/**
 * CreateTaskModal.jsx
 *
 * Modal for creating a new task. Provides a lightweight, canvas-style form with
 * borderless inputs, priority and study-block chips, and optional due date.
 * When onOpenCreateList is provided, the Category dropdown shows "+ New List" and
 * opens the same Create List modal used in the list sidebar.
 */

import { useState, useMemo, useEffect } from "react";
import { Flag } from "lucide-react";

import DateTimePicker from "./DateTimePicker";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import EstTimeHelpBanner from "../../../components/ui/EstTimeHelpBanner";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./CreateTaskModal.module.css";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ENERGY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STUDY_BLOCK_OPTIONS = [
  { value: 1, label: "25m" },
  { value: 2, label: "50m" },
  { value: 3, label: "1h 15m" },
  { value: 4, label: "1h 40m" },
];

/** estimated_blocks value -> duration in minutes */
const BLOCK_MINUTES = { 1: 25, 2: 50, 3: 75, 4: 100 };

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
  } catch (_) {}
  return FALLBACK_COLOURS[idx % FALLBACK_COLOURS.length];
}

/**
 * Create Task modal. Public props: lists, defaultListId, onSave, onClose.
 * Optional: onOpenCreateList — when provided, Category dropdown shows "+ New List" and opens the Create List modal (same as sidebar).
 * Optional: newListIdCreated — when set (after creating a list from that modal), form category is set to this list.
 * Optional: showAddToScheduleToggle, addToScheduleLabel, modules.
 */
export default function CreateTaskModal({ lists, defaultListId, defaultDueDate, onSave, onClose, onOpenCreateList, newListIdCreated, showAddToScheduleToggle = false, addToScheduleLabel = "Add to today's schedule", modules = [] }) {
  const sortedLists = useMemo(
    () => [...(lists || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [lists]
  );
  const sortedModules = useMemo(
    () => [...(modules || [])].sort((a, b) => (a.module_code || "").localeCompare(b.module_code || "")),
    [modules]
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    energy_level: "medium",
    due_date: defaultDueDate ?? "",
    task_list: defaultListId || (sortedLists[0]?.id ?? ""),
    estimated_blocks: 1,
    module: "",
  });
  const [addToSchedule, setAddToSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const durationMinutes = BLOCK_MINUTES[form.estimated_blocks] ?? 25;
  const endTimeDisplay = useMemo(() => {
    if (!form.due_date) return "—";
    const start = new Date(form.due_date);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }, [form.due_date, durationMinutes]);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      due_date: form.due_date || null,
      module: form.module ? Number(form.module) : null,
    };
    if (showAddToScheduleToggle) {
      await onSave(payload, { addToSchedule });
    } else {
      await onSave(payload);
    }
    setSaving(false);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose} onKeyDown={handleKey}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New task</h2>
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
              <label className={styles.gridLabel}>Start time</label>
              <DateTimePicker
                value={form.due_date}
                onChange={(val) => set("due_date", val)}
                placeholder="Optional"
              />
            </div>
            <div className={styles.endTimeWrap}>
              <label className={styles.gridLabel}>End time</label>
              <div className={styles.endTimeDisplay} aria-live="polite">
                {form.due_date ? endTimeDisplay : "—"}
              </div>
            </div>
          </div>
          <div className={styles.durationRow}>
            <EstTimeHelpBanner
              message="Not sure what estimated time to put? Ask Flax for a suggestion."
              ctaLabel="Ask Flax"
              className={styles.estTimeBannerModal}
            />
            <div className={styles.chipGroup}>
              {STUDY_BLOCK_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.chip} ${form.estimated_blocks === value ? styles.chipActive : ""}`}
                  onClick={() => set("estimated_blocks", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
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
                  className={styles.listAnimatedDropdown}
                />
              </div>
            </div>
            <div className={styles.rowBlock}>
              <span className={styles.rowLabel}>Priority</span>
              <div className={styles.iconGroup}>
                <Flag className={styles.icon} size={16} aria-hidden />
                <div className={`${styles.chipGroup} ${styles.chipGroupSingleRow}`}>
                  {PRIORITY_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.chip} ${form.priority === value ? styles.chipActive : ""}`}
                      onClick={() => set("priority", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.rowBlock}>
              <span className={styles.rowLabel}>Energy</span>
              <div className={styles.chipGroup}>
                {ENERGY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.chip} ${form.energy_level === value ? styles.chipActive : ""}`}
                    onClick={() => set("energy_level", value)}
                    title={value === "high" ? "High cognitive load — avoid back-to-back with another high-energy task" : value === "low" ? "Quick / low effort" : "Moderate"}
                  >
                    {label}
                  </button>
                ))}
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

          {showAddToScheduleToggle && (
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
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? "Saving…" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}
