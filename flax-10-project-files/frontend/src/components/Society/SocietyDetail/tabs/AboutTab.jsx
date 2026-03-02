import { useState } from "react";
import styles from "./tabs.module.css";

const isValidEmail = (email) => {
    const trimmed = email.trim();
    return trimmed.includes("@") && trimmed.split("@")[0].length > 0 && trimmed.split("@")[1].length > 0;
};

export default function AboutTab({ about, adminEmails, editMode, onUpdate }) {
    if (editMode) return <AboutEditor about={about} emails={adminEmails} onUpdate={onUpdate} />;
    return <AboutDisplay about={about} emails={adminEmails} />;
}

function AboutDisplay({ about, emails }) {
    if (!about && !emails) return <p className={styles.empty}>No about information yet.</p>;
    return (
        <div className={styles.aboutContainer}>
            {about && <p className={styles.aboutText}>{about}</p>}
            {emails && <AdminEmails emails={emails} />}
        </div>
    );
}

function AdminEmails({ emails }) {
    const list = emails.split(",").map(e => e.trim());
    return (
        <div className={styles.emailSection}>
            <span className={styles.emailLabel}>Admin:</span>
            <div className={styles.emailList}>
                {list.map((email, i) => (
                    <a key={i} href={`mailto:${email}`} className={styles.emailLink}>
                        {email}{i < list.length - 1 ? ", " : ""}
                    </a>
                ))}
            </div>
        </div>
    );
}

function AboutEditor({ about, emails, onUpdate }) {
    const [vals, setVals] = useState({ about: about || "", emails: emails || "" });
    const emailList = vals.emails.split(",").filter(e => e.trim());
    const allValid = emailList.length > 0 && emailList.every(isValidEmail);
    const isDirty = vals.about !== (about || "") || vals.emails !== (emails || "");

    return (
        <div className={styles.editorContainer}>
            <textarea className={styles.aboutInput} value={vals.about} rows={5}
                onChange={e => setVals(p => ({ ...p, about: e.target.value }))}
                placeholder="Write about your society..." />
            <EmailInput emails={vals.emails} onChange={e => setVals(p => ({ ...p, emails: e.target.value }))} />
            {!allValid && vals.emails.trim() && <p className={styles.error}>Please enter at least one valid email</p>}
            {!vals.emails.trim() && <p className={styles.error}>Admin email is compulsory</p>}
            <EditorActions onCancel={() => onUpdate?.({})}
                onSave={() => onUpdate?.({ about: vals.about, admin_emails: vals.emails })}
                disabled={!isDirty || !allValid} />
        </div>
    );
}

function EmailInput({ emails, onChange }) {
    return (
        <div className={styles.emailInputSection}>
            <label className={styles.smallLabel}>Admin Emails (comma separated)</label>
            <input className={styles.emailInput} value={emails} onChange={onChange}
                placeholder="e.g. admin@flax.com, info@flax.com" />
        </div>
    );
}

function EditorActions({ onCancel, onSave, disabled }) {
    return (
        <div className={styles.editorActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button className={styles.saveBtn} onClick={onSave} disabled={disabled}>Save Changes</button>
        </div>
    );
}
