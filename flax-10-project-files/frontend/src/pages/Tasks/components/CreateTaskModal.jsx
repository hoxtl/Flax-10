/**
 * CreateTaskModal.jsx
 *
 * Modal for creating a new task. Provides a lightweight, canvas-style form with
 * borderless inputs, priority and study-block chips, and optional due date.
 * Supports creating a new list directly from the List dropdown when onCreateList is provided.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Flag } from "lucide-react";

import DateTimePicker from "./DateTimePicker";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
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
 * Optional: onCreateList — when provided, the List dropdown shows "+ Create new list" and can create a list inline.
 * Optional: showAddToScheduleToggle, addToScheduleLabel — when set, shows a toggle and passes { addToSchedule } as second arg to onSave.
 * Optional: modules — when set, shows "Link to Module" dropdown; each item { id, module_code, module_name or title }.
 */
export default function CreateTaskModal({ lists, defaultListId, defaultDueDate, onSave, onClose, onCreateList, showAddToScheduleToggle = false, addToScheduleLabel = "Add to today's schedule", modules = [] }) {
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
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [showCreateListInput, setShowCreateListInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const listDropdownRef = useRef(null);
  const newListInputRef = useRef(null);

  useEffect(() => {
    if (showCreateListInput && newListInputRef.current) {
      newListInputRef.current.focus();
    }
  }, [showCreateListInput]);

  useEffect(() => {
    if (!listDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(e.target)) {
        setListDropdownOpen(false);
        setShowCreateListInput(false);
        setNewListName("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [listDropdownOpen]);

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

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name || !onCreateList) return;
    setCreatingList(true);
    try {
      const created = await onCreateList({ name, color: FALLBACK_COLOURS[0] });
      if (created?.id) {
        setForm((p) => ({ ...p, task_list: String(created.id) }));
        setShowCreateListInput(false);
        setNewListName("");
        setListDropdownOpen(false);
      }
    } finally {
      setCreatingList(false);
    }
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
              <div className={styles.listSelectWrap} ref={listDropdownRef}>
                <button
                  type="button"
                  className={styles.listSelectTrigger}
                  onClick={() => setListDropdownOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={listDropdownOpen}
                  aria-label="List"
                >
                  <span className={styles.listSelectValue}>
                    {selectedList ? selectedList.name : "Select list"}
                  </span>
                  <span className={styles.listSelectChevron} aria-hidden>▾</span>
                </button>
                {listDropdownOpen && (
                  <div className={styles.listDropdown} role="listbox">
                    {sortedLists.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        role="option"
                        aria-selected={String(form.task_list) === String(l.id)}
                        className={`${styles.listDropdownOption} ${String(form.task_list) === String(l.id) ? styles.listDropdownOptionActive : ""}`}
                        onClick={() => {
                          setForm((p) => ({ ...p, task_list: String(l.id) }));
                          setListDropdownOpen(false);
                        }}
                      >
                        <span className={styles.listOptionDot} style={{ background: getListColor(l, sortedLists.indexOf(l)) }} />
                        {l.name}
                      </button>
                    ))}
                    {typeof onCreateList === "function" && (
                      <>
                        <div className={styles.listDropdownDivider} />
                        <button
                          type="button"
                          className={styles.listDropdownCreate}
                          onClick={() => setShowCreateListInput((v) => !v)}
                        >
                          {showCreateListInput ? "− Hide new list" : "+ New List"}
                        </button>
                        <div
                          className={styles.listCreateSlide}
                          style={{ maxHeight: showCreateListInput ? 160 : 0 }}
                        >
                          <div className={styles.listCreateSlideInner}>
                            <div className={styles.listCreateInline}>
                              <input
                                type="text"
                                ref={newListInputRef}
                                className={styles.listCreateInput}
                                placeholder="List name…"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                                aria-label="New list name"
                              />
                              <button
                                type="button"
                                className={styles.listCreateBtn}
                                onClick={handleCreateList}
                                disabled={creatingList || !newListName.trim()}
                              >
                                {creatingList ? "Creating…" : "Create"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.rowBlock}>
              <span className={styles.rowLabel}>Priority</span>
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
