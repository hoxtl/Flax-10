import { useState } from "react";
import styles from "./tabs.module.css";

export default function AboutTab({ about, adminEmails, editMode, onUpdate }) {
    if (editMode) {
        return <AboutEditor about={about} emails={adminEmails} onUpdate={onUpdate} />;
    }
    return <AboutDisplay about={about} emails={adminEmails} />;
}

function AboutDisplay({ about, emails }) {
    if (!about && !emails) {
        return <p className={styles.empty}>No about information yet.</p>;
    }
    return (
        <div className={styles.aboutContainer}>
            {about && <p className={styles.aboutText}>{about}</p>}
            {emails && <AdminEmails emails={emails} />}
        </div>
    );
}

function AdminEmails({ emails }) {
    return (
        <div className={styles.emailSection}>
            <span className={styles.emailLabel}>Admin:</span>
            <span className={styles.emailValue}>{emails}</span>
        </div>
    );
}

function AboutEditor({ about, emails, onUpdate }) {
    const [vals, setVals] = useState({ about: about || "", emails: emails || "" });
    const isDirty = vals.about !== (about || "") || vals.emails !== (emails || "");

    const handleChange = (field, value) => {
        setVals(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.editorContainer}>
            <textarea className={styles.aboutInput} value={vals.about} rows={5}
                onChange={e => handleChange("about", e.target.value)}
                placeholder="Write about your society..." />
            <div className={styles.emailInputSection}>
                <label className={styles.smallLabel}>Admin Emails (comma separated)</label>
                <input className={styles.emailInput} value={vals.emails}
                    onChange={e => handleChange("emails", e.target.value)}
                    placeholder="e.g. admin@flax.com, info@flax.com" />
            </div>
            <EditorActions onCancel={() => onUpdate?.({})}
                onSave={() => onUpdate?.({ about: vals.about, admin_emails: vals.emails })}
                isDirty={isDirty} />
        </div>
    );
}

function EditorActions({ onCancel, onSave, isDirty }) {
    return (
        <div className={styles.editorActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button className={styles.saveBtn} onClick={onSave} disabled={!isDirty}>
                {isDirty ? "Save Changes" : "Saved"}
            </button>
        </div>
    );
}
