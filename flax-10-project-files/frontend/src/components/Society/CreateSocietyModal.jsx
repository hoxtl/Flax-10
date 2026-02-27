import { useState } from "react";
import styles from "./CreateSocietyModal.module.css";
import AddCollaboratorModal from "./AddCollaboratorModal";
import CollaboratorList from "./CollaboratorList";
import { RatificationToggle } from "./SocietyDetail/RatificationSection";
import CoverImageModal from "./SocietyDetail/imageHandlers/CoverImageModal";
import CategorySelector from "./CategorySelector";

const isValidEmail = (email) => {
    const trimmed = email.trim();
    return trimmed.includes("@") && trimmed.split("@")[0].length > 0 && trimmed.split("@")[1].length > 0;
};

export default function CreateSocietyModal({ onClose, onCreate }) {
    const logic = useCreateSocietyForm(onCreate, onClose);
    return (
        <>
            <div className={styles.backdrop} onMouseDown={onClose}>
                <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                    <ModalHeader onClose={onClose} />
                    <FormFields {...logic} />
                    <ModalFooter onClose={onClose} onCreate={logic.handleSubmit} disabled={logic.isCreateDisabled} />
                </div>
            </div>
            {logic.showCollabModal && <AddCollaboratorModal {...logic.collabModalProps} />}
            {logic.showPhotoModal && <CoverImageModal {...logic.photoModalProps} />}
        </>
    );
}

function useCreateSocietyForm(onCreate, onClose) {
    const [form, setForm] = useState({ name: "", bio: "", category: "", adminEmails: "", requestRatification: false, collaborators: [], images: [] });
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

    const handleAddCollabs = (users) => {
        const newCollabs = users.map(u => ({ ...u, role: "editor" }));
        update("collaborators", [...form.collaborators, ...newCollabs]);
    };

    const emailList = form.adminEmails.split(",").filter(e => e.trim());
    const emailsInvalid = emailList.length > 0 && !emailList.every(isValidEmail);

    return {
        form, update, showCollabModal, setShowCollabModal, showPhotoModal, setShowPhotoModal,
        collabModalProps: getCollabModalProps(form, setShowCollabModal, handleAddCollabs),
        photoModalProps: getPhotoModalProps(form, setShowPhotoModal, update),
        isCreateDisabled: !form.name.trim() || emailsInvalid,
        emailsInvalid,
        handleSubmit: () => onCreate(form)
    };
}

function getCollabModalProps(form, setShowCollabModal, onAdd) {
    return {
        onClose: () => setShowCollabModal(false),
        onAdd,
        existingUsernames: form.collaborators.map(c => c.username)
    };
}

function getPhotoModalProps(form, setShowPhotoModal, update) {
    return {
        images: form.images, availablePhotos: [],
        onClose: () => setShowPhotoModal(false),
        onUpdate: (imgs) => update("images", imgs)
    };
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

function FormFields({ form, update, setShowCollabModal, setShowPhotoModal, emailsInvalid }) {
    const handlers = getFieldHandlers(form, update);
    return (
        <div className={styles.form}>
            <NameField value={form.name} onChange={handlers.name} />
            <BioField value={form.bio} onChange={handlers.bio} />
            <CategorySelector value={form.category} onChange={handlers.category} />
            <AdminEmailsField value={form.adminEmails} onChange={handlers.adminEmails} invalid={emailsInvalid} />
            <PhotosField images={form.images} onOpen={() => setShowPhotoModal(true)} />
            <CollaboratorsField collaborators={form.collaborators} onOpen={() => setShowCollabModal(true)}
                onRoleChange={handlers.role} onRemove={handlers.remove} />
            <RatificationToggle requested={form.requestRatification} onToggle={handlers.ratification} />
        </div>
    );
}

function getFieldHandlers(form, update) {
    return {
        name: v => update("name", v),
        bio: v => update("bio", v),
        category: v => update("category", v),
        adminEmails: v => update("adminEmails", v),
        ratification: v => update("requestRatification", v),
        role: (id, role) => update("collaborators", form.collaborators.map(c => c.id === id ? { ...c, role } : c)),
        remove: id => update("collaborators", form.collaborators.filter(c => c.id !== id))
    };
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

function AdminEmailsField({ value, onChange, invalid }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Admin Emails (optional)</label>
            <input className={styles.input} value={value} onChange={e => onChange(e.target.value)}
                placeholder="e.g. contact@society.com, admin@society.com" />
            {invalid && <p className={styles.error}>Please check all emails are valid</p>}
            <p className={styles.hint}>Comma separated. Defaults to your email if empty.</p>
        </div>
    );
}

function PhotosField({ images, onOpen }) {
    const hasPhotos = images.length > 0;
    return (
        <div className={styles.field}>
            <label className={styles.label}>Photos ({images.length}/5)</label>
            {hasPhotos && <div className={styles.photoSummary}>
                {images.map((img, i) => <div key={i} className={styles.summaryCard} style={{ backgroundImage: `url(${img})` }} />)}
            </div>}
            <button type="button" className={styles.addCollabBtn} onClick={onOpen}>
                {hasPhotos ? "Manage Photos" : "+ Add Photos"}
            </button>
            <p className={styles.hint}>Recommended: Upload a cover photo and some gallery images</p>
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
