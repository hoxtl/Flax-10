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

const CATEGORY_TAGS = SOCIETY_CATEGORY_OPTIONS.map((category) => ({ id: category.id, label: category.label }));

function isValidEmail(email) {
    const trimmed = email.trim();
    return trimmed.includes("@") && trimmed.split("@")[0].length > 0 && trimmed.split("@")[1].length > 0;
}

function initialForm() {
    return { name: "", bio: "", categories: [], adminEmails: "", requestRatification: false, collaborators: [], images: [] };
}

function allEmailsValid(emails) {
    const list = emails.split(",").filter((email) => email.trim());
    return list.every(isValidEmail);
}

function useCreateSocietyState() {
    const [form, setForm] = useState(initialForm());
    const [modals, setModals] = useState({ collab: false, photo: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    return { form, setForm, modals, setModals, isSubmitting, setIsSubmitting, submitError, setSubmitError };
}

async function submitCreateSociety(form, onCreate, showToast, setIsSubmitting, setSubmitError) {
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
}

function getCollabModalProps(form, setModals, onAdd) {
    return {
        onClose: () => setModals((current) => ({ ...current, collab: false })),
        onAdd,
        existingUsernames: form.collaborators.map((collaborator) => collaborator.username)
    };
}

function getPhotoModalProps(form, setModals, update) {
    return {
        images: form.images,
        onClose: () => setModals((current) => ({ ...current, photo: false })),
        onUpdate: (images) => update("images", images.slice(0, 1))
    };
}

function useCreateSocietyForm(onCreate) {
    const state = useCreateSocietyState();
    const showToast = useToast();
    const update = (field, value) => state.setForm((current) => ({ ...current, [field]: value }));
    const handleAddCollabs = (users) => update("collaborators", [...state.form.collaborators, ...users.map((user) => ({ ...user, role: "editor" }))]);
    const isInvalid = !state.form.name.trim() || !allEmailsValid(state.form.adminEmails);
    const handleSubmit = () => !isInvalid && !state.isSubmitting && submitCreateSociety(state.form, onCreate, showToast, state.setIsSubmitting, state.setSubmitError);
    return buildCreateFormApi(state, update, handleAddCollabs, handleSubmit, isInvalid);
}

function buildCreateFormApi(state, update, handleAddCollabs, handleSubmit, isInvalid) {
    return {
        form: state.form,
        update,
        modals: state.modals,
        setModals: state.setModals,
        isSubmitting: state.isSubmitting,
        submitError: state.submitError,
        isCreateDisabled: isInvalid || state.isSubmitting,
        collabModalProps: getCollabModalProps(state.form, state.setModals, handleAddCollabs),
        photoModalProps: getPhotoModalProps(state.form, state.setModals, update),
        handleSubmit,
    };
}

/** Presents the society creation flow, including collaborators and the cover image picker. */
export default function CreateSocietyModal({ onClose, onCreate }) {
    const logic = useCreateSocietyForm(onCreate);
    return (
        <>
            <CreateSocietyDialog logic={logic} onClose={onClose} />
            {logic.modals.collab && <AddCollaboratorModal {...logic.collabModalProps} />}
            {logic.modals.photo && <CoverImageModal {...logic.photoModalProps} />}
        </>
    );
}

function CreateSocietyDialog({ logic, onClose }) {
    return (
        <StandardModal title="Create Society" onClose={onClose} modalClassName={styles.modalPanel} contentClassName={styles.modalContent}>
            <FormFields form={logic.form} update={logic.update} setModals={logic.setModals} />
            {logic.submitError && <p className={styles.submitError}>{logic.submitError}</p>}
            <ModalFooter onClose={onClose} onCreate={logic.handleSubmit} disabled={logic.isCreateDisabled} isSubmitting={logic.isSubmitting} />
        </StandardModal>
    );
}

function FormFields({ form, update, setModals }) {
    const handlers = getFieldHandlers(form, update);
    const invalidEmails = form.adminEmails.trim() && !allEmailsValid(form.adminEmails);
    return (
        <div className={styles.form}>
            <NameField value={form.name} onChange={handlers.name} />
            <BioField value={form.bio} onChange={handlers.bio} />
            <CategoriesField value={form.categories} onChange={handlers.categories} />
            <PhotosField images={form.images} onOpen={() => setModals((current) => ({ ...current, photo: true }))} />
            <AdminEmailsField value={form.adminEmails} onChange={handlers.adminEmails} invalid={invalidEmails} />
            <CollaboratorsField collaborators={form.collaborators} onOpen={() => setModals((current) => ({ ...current, collab: true }))} onRoleChange={handlers.role} onRemove={handlers.remove} />
            <RatificationToggle requested={form.requestRatification} onToggle={handlers.ratification} />
        </div>
    );
}

function getFieldHandlers(form, update) {
    return {
        name: (value) => update("name", value),
        bio: (value) => update("bio", value),
        categories: (value) => update("categories", value),
        adminEmails: (value) => update("adminEmails", value),
        ratification: (value) => update("requestRatification", value),
        role: (id, role) => update("collaborators", form.collaborators.map((collaborator) => (collaborator.user || collaborator.id) === id ? { ...collaborator, role } : collaborator)),
        remove: (id) => update("collaborators", form.collaborators.filter((collaborator) => (collaborator.user || collaborator.id) !== id))
    };
}

function CategoriesField({ value, onChange }) {
    const selectedTagObjects = CATEGORY_TAGS.filter((tag) => value.includes(tag.id));
    const handleSelectionChange = (selection) => onChange(selection.map((tag) => tag.id));
    return (
        <div className={styles.field}>
            <label className={styles.label}>Categories</label>
            <TagsSelector tags={CATEGORY_TAGS} selectedTags={selectedTagObjects} onSelectionChange={handleSelectionChange} emptyHint="Select society categories…" />
        </div>
    );
}

function NameField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Society Name <span className={styles.required}>*</span></label>
            <TextInput value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. Photography Club" />
        </div>
    );
}

function BioField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Bio / Description</label>
            <TextInput multiline value={value} onChange={(event) => onChange(event.target.value)} placeholder="What is your society about?" rows={3} />
        </div>
    );
}

function AdminEmailsField({ value, onChange, invalid }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Admin Emails <span className={styles.optional}>(optional)</span></label>
            <TextInput value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. contact@society.com, admin@society.com" />
            {invalid ? <p className={styles.error}>Please check all emails are valid</p> : <p className={styles.hint}>Comma separated. Defaults to your email if empty.</p>}
        </div>
    );
}

function PhotosField({ images, onOpen }) {
    const hasPhotos = images.length > 0;
    const coverImage = images[0];
    return (
        <div className={styles.field}>
            <label className={styles.label}>Cover Image <span className={styles.optional}>({hasPhotos ? 1 : 0}/1)</span></label>
            {hasPhotos && <div className={styles.photoSummary}><div className={styles.summaryCard} style={{ backgroundImage: `url("${coverImage}")` }} /></div>}
            <PrimaryButton type="button" className={styles.addCollabBtn} variant="secondary" pill onClick={onOpen}>{hasPhotos ? "Edit Cover Image" : "+ Add Cover Image"}</PrimaryButton>
            <p className={styles.hint}>Use one clear image for the society card and banner.</p>
        </div>
    );
}

function CollaboratorsField({ collaborators, onOpen, onRoleChange, onRemove }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Collaborators <span className={styles.optional}>(optional)</span></label>
            {collaborators.length > 0 && <CollaboratorList collaborators={collaborators} onRoleChange={onRoleChange} onRemove={onRemove} />}
            <PrimaryButton type="button" className={styles.addCollabBtn} variant="secondary" pill onClick={onOpen}>+ Add Collaborators</PrimaryButton>
            <p className={styles.hint}>Collaborators can edit society details and manage events</p>
        </div>
    );
}

function ModalFooter({ onClose, onCreate, disabled, isSubmitting }) {
    return (
        <div className={styles.footer}>
            <PrimaryButton className={styles.cancelBtn} onClick={onClose} type="button" variant="secondary" pill>Cancel</PrimaryButton>
            <PrimaryButton className={styles.createBtn} onClick={onCreate} type="button" disabled={disabled} pill>{isSubmitting ? "Creating..." : "Create Society"}</PrimaryButton>
        </div>
    );
}
