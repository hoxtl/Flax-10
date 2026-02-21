import { useState } from "react";
import styles from "./CreateTaskModal.module.css";

export default function CreateListModal({ onSave, onClose }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("personal");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await onSave({ name, category });
        setSaving(false);
        onClose();
    };

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>New List</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div className={styles.body}>
                    <input className={styles.titleInput} placeholder="List name e.g. Uni, Personal" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    <div className={styles.field}>
                        <label>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="uni">University</option>
                            <option value="society">Society</option>
                            <option value="personal">Personal</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving || !name.trim()}>
                        {saving ? "Saving..." : "Create List"}
                    </button>
                </div>
            </div>
        </div>
    );
}