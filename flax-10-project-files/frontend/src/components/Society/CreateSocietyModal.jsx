import { useState } from "react";
import styles from "./CreateSocietyModal.module.css";
import AddCollaboratorModal from "./AddCollaboratorModal";
import CollaboratorList from "./CollaboratorList";

export default function CreateSocietyModal({ onClose, onCreate }) {
    const [form, setForm] = useState({ name: "", bio: "", collaborators: [] });
    const [showCollabModal, setShowCollabModal] = useState(false);
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleAddCollaborators = (users) => {
        const newCollabs = users.map(u => ({ ...u, role: "editor" }));
        update("collaborators", [...form.collaborators, ...newCollabs]);
    };

    const handleRoleChange = (id, role) => {
        update("collaborators", form.collaborators.map(c => c.id === id ? { ...c, role } : c));
    };

    const handleRemove = (id) => update("collaborators", form.collaborators.filter(c => c.id !== id));

    return (
        <>
            <div className={styles.backdrop} onMouseDown={onClose}>
                <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                    <ModalHeader onClose={onClose} />
                    <FormFields form={form} update={update} onOpenCollabModal={() => setShowCollabModal(true)}
                        onRoleChange={handleRoleChange} onRemove={handleRemove} />
                    <ModalFooter onClose={onClose} onCreate={() => onCreate(form)} disabled={!form.name.trim()} />
                </div>
            </div>
            {showCollabModal && <AddCollaboratorModal onClose={() => setShowCollabModal(false)}
                onAdd={handleAddCollaborators} existingUsernames={form.collaborators.map(c => c.username)} />}
        </>
    );
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

function FormFields({ form, update, onOpenCollabModal, onRoleChange, onRemove }) {
    return (
        <div className={styles.form}>
            <NameField value={form.name} onChange={v => update("name", v)} />
            <BioField value={form.bio} onChange={v => update("bio", v)} />
            <CollaboratorsField collaborators={form.collaborators} onOpen={onOpenCollabModal}
                onRoleChange={onRoleChange} onRemove={onRemove} />
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

function CollaboratorsField({ collaborators, onOpen, onRoleChange, onRemove }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Collaborators</label>
            <CollaboratorList collaborators={collaborators} onRoleChange={onRoleChange}
                onRemove={onRemove} emptyMessage="No collaborators added yet." />
            <button type="button" className={styles.addCollabBtn} onClick={onOpen}>+ Add Collaborators</button>
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
