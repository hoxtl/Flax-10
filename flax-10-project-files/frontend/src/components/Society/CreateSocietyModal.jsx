import { useState } from "react";
import styles from "./CreateSocietyModal.module.css";

export default function CreateSocietyModal({ onClose, onCreate }) {
    const [form, setForm] = useState(getInitialForm());
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <FormFields form={form} update={update} />
                <ModalFooter onClose={onClose} onCreate={() => onCreate(form)} disabled={!form.name.trim()} />
            </div>
        </div>
    );
}

function getInitialForm() {
    return { name: "", bio: "", isRatified: false, collaborators: "" };
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <div>
                <h2 className={styles.title}>Create Society</h2>
                <p className={styles.sub}>Start your own society or club</p>
            </div>
            <button className={styles.close} onClick={onClose} type="button">&times;</button>
        </div>
    );
}

function FormFields({ form, update }) {
    return (
        <div className={styles.form}>
            <NameField value={form.name} onChange={v => update("name", v)} />
            <BioField value={form.bio} onChange={v => update("bio", v)} />
            <CollaboratorsField value={form.collaborators} onChange={v => update("collaborators", v)} />
            <RatifiedToggle value={form.isRatified} onChange={v => update("isRatified", v)} />
        </div>
    );
}

function NameField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Society Name *</label>
            <input className={styles.input} value={value} onChange={e => onChange(e.target.value)}
                placeholder="e.g. Photography Club" />
        </div>
    );
}

function BioField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Bio / Description</label>
            <textarea className={styles.textarea} value={value} onChange={e => onChange(e.target.value)}
                placeholder="What is your society about?" rows={3} />
        </div>
    );
}

function CollaboratorsField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Collaborators</label>
            <input className={styles.input} value={value} onChange={e => onChange(e.target.value)}
                placeholder="Add emails separated by commas" />
            <p className={styles.hint}>Collaborators can edit society details and manage events</p>
        </div>
    );
}

function RatifiedToggle({ value, onChange }) {
    return (
        <div className={styles.field}>
            <div className={styles.toggleRow}>
                <div>
                    <label className={styles.label}>Ratified Society</label>
                    <p className={styles.hint}>Ratified societies are officially recognized by the university</p>
                </div>
                <Toggle checked={value} onChange={onChange} />
            </div>
            {value && <RatifiedNotice />}
        </div>
    );
}

function RatifiedNotice() {
    return (
        <div className={styles.notice}>
            <span className={styles.noticeIcon}>i</span>
            <span>Ratification requires verification. Your society will show as pending until approved.</span>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
            onClick={() => onChange(!checked)} type="button">
            <span className={styles.toggleKnob} />
        </button>
    );
}

function ModalFooter({ onClose, onCreate, disabled }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
            <button className={styles.createBtn} onClick={onCreate} type="button" disabled={disabled}>
                Create Society
            </button>
        </div>
    );
}
