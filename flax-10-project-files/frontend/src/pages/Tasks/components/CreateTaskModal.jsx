import { useState } from "react";
import DateTimePicker from "./DateTimePicker";
import styles from "./CreateTaskModal.module.css";

export default function CreateTaskModal({ lists, defaultListId, onSave, onClose }) {
    const [form, setForm] = useState({
        title:            "",
        description:      "",
        priority:         "medium",
        due_date:         "",
        task_list:        defaultListId || (lists[0]?.id ?? ""),
    });
    const [saving, setSaving] = useState(false);

    const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

    const handleSave = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        await onSave({ ...form, due_date: form.due_date || null });
        setSaving(false);
        onClose();
    };

    const handleKey = (e) => { if (e.key === "Escape") onClose(); };

    return (
        <div className={styles.overlay} onMouseDown={onClose} onKeyDown={handleKey}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>New task</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Body — compact layout so date picker is visible without scrolling */}
                <div className={styles.body}>
                    <input
                        className={styles.titleInput}
                        placeholder="Task title…"
                        value={form.title}
                        onChange={e => set("title", e.target.value)}
                        autoFocus
                    />

                    <textarea
                        className={styles.desc}
                        placeholder="Description (optional)"
                        rows={2}
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                    />

                    <div className={styles.rowThree}>
                        <div className={styles.field}>
                            <label>PRIORITY</label>
                            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>LIST</label>
                            <select value={form.task_list} onChange={e => set("task_list", e.target.value)}>
                                {lists.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>DUE DATE & TIME</label>
                            <DateTimePicker
                                value={form.due_date}
                                onChange={val => set("due_date", val)}
                                placeholder="Pick date & time (optional)"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button
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