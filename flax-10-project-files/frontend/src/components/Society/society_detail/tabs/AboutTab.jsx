/**
 * AboutTab displays and edits the general information about a society,
 * including its biography and administrator contact emails.
 */

import { useState } from "react";
import PrimaryButton from "../../../common/primary_button/PrimaryButton";
import styles from "./Tabs.module.css";

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

/** Editor interface for updating society bio and admin emails. */

function AboutEditor({ about, emails, onUpdate }) {
    const vals = useAboutForm(about, emails);
    const handlers = getAboutHandlers(onUpdate, vals);

    return (
        <div className={styles.editorContainer}>
            <textarea className={styles.aboutInput} value={vals.state.about} rows={5}
                onChange={handlers.about} placeholder="Write about your society..." />
            <EmailInput emails={vals.state.emails} onChange={handlers.emails} />
            <AboutValidation emails={vals.state.emails} onUpdate={onUpdate}
                state={vals.state} orig={{ about, emails }} />
        </div>
    );
}

function useAboutForm(about, emails) {
    const [state, setState] = useState({ about: about || "", emails: emails || "" });
    return { state, setState };
}

function getAboutHandlers(onUpdate, { setState }) {
    return {
        about: e => setState(p => ({ ...p, about: e.target.value })),
        emails: e => setState(p => ({ ...p, emails: e.target.value }))
    };
}

function AboutValidation({ emails, onUpdate, state, orig }) {
    const list = emails.split(",").filter(e => e.trim());
    const valid = list.length > 0 && list.every(isValidEmail);
    const isDirty = state.about !== (orig.about || "") || state.emails !== (orig.emails || "");

    return (
        <>
            {!valid && emails.trim() && <p className={styles.error}>Invalid email(s)</p>}
            {!emails.trim() && <p className={styles.error}>Email is compulsory</p>}
            <EditorActions onCancel={() => onUpdate?.({})}
                onSave={() => onUpdate?.({ about: state.about, admin_emails: state.emails })}
                disabled={!isDirty || !valid} />
        </>
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
            <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel}>Cancel</PrimaryButton>
            <PrimaryButton className={styles.saveBtn} pill onClick={onSave} disabled={disabled}>Save Changes</PrimaryButton>
        </div>
    );
}
