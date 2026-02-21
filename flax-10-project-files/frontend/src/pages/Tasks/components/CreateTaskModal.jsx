import { useState, useEffect } from "react";
import { getEnrollments } from "../../../api/moduleApi";
import styles from "./CreateTaskModal.module.css";

function useModules() {
    const [modules, setModules] = useState([]);
    useEffect(() => {
        getEnrollments().then(data => setModules(data)).catch(() => {});
    }, []);
    return modules;
}

function useForm(defaultListId) {
    const [form, setForm] = useState({
        title: "", description: "", priority: "medium",
        due_date: "", task_list: defaultListId || "", module: "",
        add_to_calendar: false,
    });
    const set = (field, value) => setForm(p => ({ ...p, [field]: value }));
    return { form, set };
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h2 className={styles.title}>New Task</h2>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
    );
}

export default function CreateTaskModal({ lists, defaultListId, onSave, onClose }) {
    const { form, set } = useForm(defaultListId);
    const modules = useModules();
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        const payload = {
            ...form,
            task_list: form.task_list || null,
            module: form.module || null,
            due_date: form.due_date || null,
        };
        await onSave(payload);
        setSaving(false);
        onClose();
    };

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <div className={styles.body}>
                    <input className={styles.titleInput} placeholder="Task title" value={form.title} onChange={e => set("title", e.target.value)} autoFocus />
                    <textarea className={styles.desc} placeholder="Description (optional)" value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Priority</label>
                            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>List</label>
                            <select value={form.task_list} onChange={e => set("task_list", e.target.value)}>
                                <option value="">No list</option>
                                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Module</label>
                            <select value={form.module} onChange={e => set("module", e.target.value)}>
                                <option value="">No module</option>
                                {modules.map(e => <option key={e.module} value={e.module}>{e.module_code}</option>)}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Due date</label>
                            <input type="datetime-local" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
                        </div>
                    </div>
                    <label className={styles.checkRow}>
                        <input type="checkbox" checked={form.add_to_calendar} onChange={e => set("add_to_calendar", e.target.checked)} />
                        Add to calendar
                    </label>
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving || !form.title.trim()}>
                        {saving ? "Saving..." : "Add Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}