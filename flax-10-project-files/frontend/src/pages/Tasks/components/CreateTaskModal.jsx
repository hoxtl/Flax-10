/**
 * CreateTaskModal.jsx
 *
 * Modal for creating a new task. Provides a lightweight, canvas-style form with
 * borderless inputs, priority and study-block chips, and optional due date.
 * Matches dashboard card styling (rounded corners, cohesive hierarchy).
 */

import { useState, useMemo } from "react";
import { Flag, Clock } from "lucide-react";

import DateTimePicker from "./DateTimePicker";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./CreateTaskModal.module.css";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

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
  } catch (_) {}
  return FALLBACK_COLOURS[idx % FALLBACK_COLOURS.length];
}

/**
 * Create Task modal. Public props: lists, defaultListId, onSave, onClose.
 * Optional: showAddToScheduleToggle, addToScheduleLabel — when set, shows a toggle and passes { addToSchedule } as second arg to onSave.
 * Optional: modules — when set, shows "Link to Module" dropdown; each item { id, module_code, module_name or title }.
 */
export default function CreateTaskModal({ lists, defaultListId, defaultDueDate, onSave, onClose, showAddToScheduleToggle = false, addToScheduleLabel = "Add to today's schedule", modules = [] }) {
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
    due_date: defaultDueDate ?? "",
    task_list: defaultListId || (sortedLists[0]?.id ?? ""),
    estimated_blocks: 1,
    module: "",
  });
  const [addToSchedule, setAddToSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedList = useMemo(
    () => sortedLists.find((l) => String(l.id) === String(form.task_list)),
    [sortedLists, form.task_list]
  );
  const selectedListColor = selectedList
    ? getListColor(selectedList, sortedLists.indexOf(selectedList))
    : null;

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
            <input
              className={styles.titleInput}
              placeholder="What do you need to do?"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
            />
            <textarea
              className={styles.desc}
              placeholder="Description (optional)"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.iconGroup}>
              <Flag className={styles.icon} size={16} aria-hidden />
              <div className={styles.chipGroup}>
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
            <div className={styles.iconGroup}>
              <Clock className={styles.icon} size={16} aria-hidden />
              <DateTimePicker
                value={form.due_date}
                onChange={(val) => set("due_date", val)}
                placeholder="Pick date & time (optional)"
              />
            </div>
            <div className={styles.listWrap}>
              <span className={styles.listWrapLabel}>List</span>
              {selectedListColor && (
                <span className={styles.listDot} style={{ background: selectedListColor }} />
              )}
              <select
                value={form.task_list}
                onChange={(e) => set("task_list", e.target.value)}
                className={styles.select}
                aria-label="List"
              >
                {sortedLists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {sortedModules.length > 0 && (
            <div className={styles.row}>
              <div className={styles.listWrap} style={{ width: "100%" }}>
                <span className={styles.listWrapLabel}>Link to Module</span>
                <select
                  value={form.module}
                  onChange={(e) => set("module", e.target.value)}
                  className={styles.select}
                  aria-label="Link to Module"
                >
                  <option value="">No module</option>
                  {sortedModules.map((m) => (
                    <option key={m.id} value={m.id}>{m.module_code} – {m.module_name || m.title || ""}</option>
                  ))}
                </select>
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
