/**
 * AnnouncementModal provides a comprehensive form for creating and editing society announcements,
 * with optional synchronization to the society's event calendar.
 */

import { useState, useRef } from "react";
import styles from "./AnnouncementModal.module.css";
import { handleFileSelect, MAX_IMAGES } from "./AnnouncementModalHelpers";
import { TimeRow } from "../../../../Calendar/EventModal/components/TimeRow";
import { RecurrenceField } from "../../../../Calendar/EventModal/components/RecurrenceField";
import { FormField } from "../../../../Calendar/EventModal/components/FormField";
import { TagField } from "../../../../Calendar/EventModal/components/TagField";
import ConfirmModal from "../../../../common/ConfirmModal/ConfirmModal";
import StandardModal from "../../../../common/StandardModal/StandardModal";
import PrimaryButton from "../../../../common/PrimaryButton/PrimaryButton";
import "../../../../Calendar/EventModal/EventModal.css";
import { useAnnouncementForm } from "./useAnnouncementForm";

export default function AnnouncementModal({ onClose, onSubmit, onDelete, tags = [], announcement = null, societyId, announcements = [] }) {
    const { form, setForm, error, submit } = useAnnouncementForm(announcement, societyId, onSubmit, announcements);
    const [showDelete, setShowDelete] = useState(false);
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <>
            <StandardModal title={announcement ? "Edit Announcement" : "Add Announcement"} onClose={onClose}>
                <ModalContent form={form} update={update} fileRef={fileRef} tags={tags}
                    error={error} onClose={onClose} onSubmit={submit} isEdit={!!announcement}
                    onDeleteClick={() => setShowDelete(true)} setForm={setForm} />
            </StandardModal>
            {showDelete && <DeleteConfirmModal hasEvent={!!announcement?.event_id}
                onConfirm={() => { onDelete?.(announcement.id); onClose(); }} onCancel={() => setShowDelete(false)} />}
        </>
    );
}

function DeleteConfirmModal({ hasEvent, onConfirm, onCancel }) {
    const message = hasEvent
        ? "This will delete the announcement and its linked event. This cannot be undone."
        : "Are you sure you want to delete this announcement? This cannot be undone.";
    return <ConfirmModal title="Delete Announcement" message={message} onConfirm={onConfirm} onCancel={onCancel} />;
}

function ModalContent({ form, update, setForm, fileRef, tags, error, onClose, onSubmit, isEdit, onDeleteClick }) {
    return (
        <>
            {error && <div className={styles.error}>{error}</div>}
            <FormFields form={form} update={update} setForm={setForm} fileRef={fileRef} tags={tags} />
            <ModalFooter onClose={onClose} onSubmit={() => onSubmit(form)} isEdit={isEdit} onDelete={onDeleteClick} />
        </>
    );
}

function FormFields({ form, update, setForm, fileRef, tags }) {
    return (
        <div className={styles.form}>
            <FormField label="Title *" value={form.title} onChange={(e) => update("title", e.target.value)} />
            <FormField label="Description" type="textarea" value={form.content} onChange={(e) => update("content", e.target.value)} />
            <TagField value={form.tag} onChange={(e) => update("tag", e.target.value)} customTags={tags} />
            <ImagesField images={form.images} fileRef={fileRef} onChange={(v) => update("images", v)} />
            <ToggleField label="Pin this announcement" checked={form.pinned} onChange={(v) => update("pinned", v)} />
            <EventSection form={form} update={update} setForm={setForm} />
        </div>
    );
}

function ImagesField({ images, fileRef, onChange }) {
    const addImage = (src) => onChange([...images, src]);
    const removeImage = (index) => onChange(images.filter((_, i) => i !== index));

    return (
        <div className={styles.field}>
            <label className={styles.label}>Images ({images.length}/{MAX_IMAGES})</label>
            <ImagesGrid images={images} onRemove={removeImage}
                canAdd={images.length < MAX_IMAGES} fileRef={fileRef} onAdd={addImage} />
        </div>
    );
}

function ImagesGrid({ images, onRemove, canAdd, fileRef, onAdd }) {
    const handleFile = (e) => handleFileSelect(e.target.files[0], onAdd, fileRef);
    return (
        <div className={styles.imagesGrid}>
            {images.map((src, i) => <ImageThumb key={i} src={src} onRemove={() => onRemove(i)} />)}
            {canAdd && <AddImageButton fileRef={fileRef} onFile={handleFile} />}
        </div>
    );
}

function ImageThumb({ src, onRemove }) {
    return (
        <div className={styles.imageThumb}>
            <img src={src} alt="Preview" />
            <button className={styles.removeBtn} onClick={onRemove}>&times;</button>
        </div>
    );
}

function AddImageButton({ fileRef, onFile }) {
    return (
        <div className={styles.addImageBtn} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
            <span>+</span>
        </div>
    );
}

function ToggleField({ label, checked, onChange }) {
    return (
        <label className={styles.toggle}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

function EventSection({ form, update, setForm }) {
    return (
        <div className={styles.eventSection}>
            <ToggleField label="Also add as event" checked={form.addAsEvent} onChange={(v) => update("addAsEvent", v)} />
            {form.addAsEvent && <EventFields form={form} update={update} setForm={setForm} />}
        </div>
    );
}

function EventFields({ form, update, setForm }) {
    const updateTime = (field) => (e) => update(field, e.target.value);
    const setRecurrence = (r) => update("recurrence", r);

    return (
        <div className={styles.eventFields}>
            <TimeRow form={form} update={updateTime} setForm={setForm} />
            <RecurrenceField value={form.recurrence} onChange={setRecurrence} />
        </div>
    );
}

function ModalFooter({ onClose, onSubmit, isEdit, onDelete }) {
    return (
        <div className={styles.footer}>
            {isEdit && <PrimaryButton variant="danger" pill onClick={onDelete}>Delete</PrimaryButton>}
            <div className={styles.footerRight}>
                <PrimaryButton variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
                <PrimaryButton variant="primary" pill onClick={onSubmit}>
                    {isEdit ? "Save Changes" : "Add Announcement"}
                </PrimaryButton>
            </div>
        </div>
    );
}
