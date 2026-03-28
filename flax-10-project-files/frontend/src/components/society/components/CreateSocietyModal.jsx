/**
 * CreateSocietyModal provides the interface for users to establish new societies.
 * Collects basic info, categories, admins, and initial collaborators.
 */

import { useState } from "react";
import styles from "../styles/CreateSocietyModal.module.css";
import AddCollaboratorModal from "./AddCollaboratorModal";
import CollaboratorList from "./CollaboratorList";
import { RatificationToggle } from "../society_detail/RatificationSection";
import CoverImageModal from "../society_detail/image_handlers/CoverImageModal";
import { SOCIETY_CATEGORY_OPTIONS } from "../../../pages/societies/utils/societyFilters";
import { TagsSelector } from "../../common/tags_selector/TagsSelector";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import StandardModal from "../../common/standard_modal/StandardModal";
import TextInput from "../../common/text_input/TextInput";
import { useToast } from "../../../context/ToastContext";

const CATEGORY_TAGS = SOCIETY_CATEGORY_OPTIONS.map(c => ({ id: c.id, label: c.label }));

const isValidEmail = (email) => {
    const trimmed = email.trim();
    return trimmed.includes("@") && trimmed.split("@")[0].length > 0 && trimmed.split("@")[1].length > 0;
};

export default function CreateSocietyModal({ onClose, onCreate }) {
    const logic = useCreateSocietyForm(onCreate);
    const { collab, photo } = logic.modals;
    return (
        <>
            <StandardModal title="Create Society" onClose={onClose} modalClassName={styles.modalPanel} contentClassName={styles.modalContent}>
                <FormFields form={logic.form} update={logic.update} setModals={logic.setModals} />
                {logic.submitError && <p className={styles.submitError}>{logic.submitError}</p>}
                <ModalFooter onClose={onClose} onCreate={logic.handleSubmit} disabled={logic.isCreateDisabled} isSubmitting={logic.isSubmitting} />
            </StandardModal>
            {collab && <AddCollaboratorModal {...logic.collabModalProps} />}
            {photo && <CoverImageModal {...logic.photoModalProps} />}
        </>
    );
}

/** Custom hook to manage the creation form state and modal logic. */

function useCreateSocietyForm(onCreate) {
    const [form, setForm] = useState(initialForm());
    const [modals, setModals] = useState({ collab: false, photo: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const showToast = useToast();
    const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

    const handleAddCollabs = (users) => {
        const newCollabs = users.map(u => ({ ...u, role: "editor" }));
        update("collaborators", [...form.collaborators, ...newCollabs]);
    };

    const isInvalid = !form.name.trim() || !allEmailsValid(form.adminEmails);

    const handleSubmit = async () => {
        if (isInvalid || isSubmitting) return;
        setSubmitError("");
        setIsSubmitting(true);
        try {
            await onCreate(form);
        } catch (error) {
            const message = error?.message || "Couldn't create the society just yet.";
            setSubmitError(message);
            showToast?.(message, { variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form, update, modals, setModals, isCreateDisabled: isInvalid || isSubmitting, isSubmitting, submitError,
        collabModalProps: getCollabModalProps(form, setModals, handleAddCollabs),
        photoModalProps: getPhotoModalProps(form, setModals, update),
        handleSubmit
    };
}

function initialForm() {
    return { name: "", bio: "", categories: [], adminEmails: "", requestRatification: false, collaborators: [], images: [] };
}

function allEmailsValid(emails) {
    const list = emails.split(",").filter(e => e.trim());
    return list.every(isValidEmail);
}

function getCollabModalProps(form, setModals, onAdd) {
    return {
        onClose: () => setModals(m => ({ ...m, collab: false })),
        onAdd,
        existingUsernames: form.collaborators.map(c => c.username)
    };
}

function getPhotoModalProps(form, setModals, update) {
    return {
        images: form.images,
        onClose: () => setModals(m => ({ ...m, photo: false })),
        onUpdate: (imgs) => update("images", imgs.slice(0, 1))
    };
}


function FormFields({ form, update, setModals }) {
    const hs = getFieldHandlers(form, update);
    const inval = form.adminEmails.trim() && !allEmailsValid(form.adminEmails);
    return (
        <div className={styles.form}>
            <NameField value={form.name} onChange={hs.name} />
            <BioField value={form.bio} onChange={hs.bio} />
            <CategoriesField value={form.categories} onChange={hs.categories} />
            <PhotosField images={form.images} onOpen={() => setModals(m => ({ ...m, photo: true }))} />
            <AdminEmailsField value={form.adminEmails} onChange={hs.adminEmails} invalid={inval} />
            <CollaboratorsField collaborators={form.collaborators} onOpen={() => setModals(m => ({ ...m, collab: true }))}
                onRoleChange={hs.role} onRemove={hs.remove} />
            <RatificationToggle requested={form.requestRatification} onToggle={hs.ratification} />
        </div>
    );
}

function getFieldHandlers(form, update) {
    return {
        name: v => update("name", v),
        bio: v => update("bio", v),
        categories: v => update("categories", v),
        adminEmails: v => update("adminEmails", v),
        ratification: v => update("requestRatification", v),
        role: (id, role) => update("collaborators", form.collaborators.map(c => (c.user || c.id) === id ? { ...c, role } : c)),
        remove: id => update("collaborators", form.collaborators.filter(c => (c.user || c.id) !== id))
    };
}

function CategoriesField({ value, onChange }) {
    const selectedTagObjects = CATEGORY_TAGS.filter(t => value.includes(t.id));
    const handleSelectionChange = (newSelected) => onChange(newSelected.map(t => t.id));
    return (
        <div className={styles.field}>
            <label className={styles.label}>Categories</label>
            <TagsSelector
                tags={CATEGORY_TAGS}
                selectedTags={selectedTagObjects}
                onSelectionChange={handleSelectionChange}
                emptyHint="Select society categories…"
            />
        </div>
    );
}

function NameField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Society Name <span className={styles.required}>*</span></label>
            <TextInput value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. Photography Club" />
        </div>
    );
}

function BioField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Bio / Description</label>
            <TextInput multiline value={value} onChange={e => onChange(e.target.value)}
                placeholder="What is your society about?" rows={3} />
        </div>
    );
}

function AdminEmailsField({ value, onChange, invalid }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Admin Emails <span className={styles.optional}>(optional)</span></label>
            <TextInput value={value} onChange={e => onChange(e.target.value)}
                placeholder="e.g. contact@society.com, admin@society.com" />
            {invalid
                ? <p className={styles.error}>Please check all emails are valid</p>
                : <p className={styles.hint}>Comma separated. Defaults to your email if empty.</p>
            }
        </div>
    );
}

function PhotosField({ images, onOpen }) {
    const hasPhotos = images.length > 0;
    const coverImage = images[0];
    return (
        <div className={styles.field}>
            <label className={styles.label}>Cover Image <span className={styles.optional}>({hasPhotos ? 1 : 0}/1)</span></label>
            {hasPhotos && <div className={styles.photoSummary}>
                <div className={styles.summaryCard} style={{ backgroundImage: `url("${coverImage}")` }} />
            </div>}
            <PrimaryButton type="button" className={styles.addCollabBtn} variant="secondary" pill onClick={onOpen}>
                {hasPhotos ? "Edit Cover Image" : "+ Add Cover Image"}
            </PrimaryButton>
            <p className={styles.hint}>Use one clear image for the society card and banner.</p>
        </div>
    );
}

function CollaboratorsField({ collaborators, onOpen, onRoleChange, onRemove }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Collaborators <span className={styles.optional}>(optional)</span></label>
            {collaborators.length > 0 && <CollaboratorList collaborators={collaborators} onRoleChange={onRoleChange}
                onRemove={onRemove} />}
            <PrimaryButton type="button" className={styles.addCollabBtn} variant="secondary" pill onClick={onOpen}>+ Add Collaborators</PrimaryButton>
            <p className={styles.hint}>Collaborators can edit society details and manage events</p>
        </div>
    );
}

function ModalFooter({ onClose, onCreate, disabled, isSubmitting }) {
    return (
        <div className={styles.footer}>
            <PrimaryButton className={styles.cancelBtn} onClick={onClose} type="button" variant="secondary" pill>Cancel</PrimaryButton>
            <PrimaryButton className={styles.createBtn} onClick={onCreate} type="button" disabled={disabled} pill>
                {isSubmitting ? "Creating..." : "Create Society"}
            </PrimaryButton>
        </div>
    );
}
