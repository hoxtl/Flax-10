import { useState, useRef, useEffect } from "react";
import styles from "./AnnouncementModal.module.css";
import { getInitialForm, validateForm, handleFileSelect, MAX_IMAGES } from "./AnnouncementModalHelpers";
import { TimeRow } from "../../../../Calendar/EventModal/components/TimeRow";
import { RecurrenceField } from "../../../../Calendar/EventModal/components/RecurrenceField";
import { FormField } from "../../../../Calendar/EventModal/components/FormField";
import { TagField } from "../../../../Calendar/EventModal/components/TagField";
import "../../../../Calendar/EventModal/EventModal.css";
import { fetchSocietyEvent } from "../../../../../api/societyApi";

export default function AnnouncementModal({ onClose, onSubmit, tags = [], announcement = null, societyId, announcements = [] }) {
    const [form, setForm] = useState(getInitialForm(announcement));
    const [error, setError] = useState("");
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    useEffect(() => {
        if (announcement?.event_id && societyId) {
            fetchSocietyEvent(societyId, announcement.event_id)
                .then(event => {
                    setForm(prev => ({
                        ...prev,
                        addAsEvent: true,
                        start_time: event.start_time,
                        end_time: event.end_time,
                        recurrence: event.recurrence
                    }));
                })
                .catch(e => console.error("Failed to load linked event", e));
        }
    }, [announcement, societyId]);

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <ModalContent form={form} update={update} fileRef={fileRef} tags={tags}
                error={error} setError={setError} onClose={onClose}
                onSubmit={(f, conflict) => handleSubmit(f, setError, onSubmit, announcements, conflict)}
                isEdit={!!announcement} setForm={setForm} />
        </div>
    );
}

function handleSubmit(form, setError, onSubmit, announcements, conflict) {
    const error = validateForm(form);
    if (error) return setError(error);

    if (form.pinned) {
        const currentPinned = announcements.find(a => a.pinned && a.id !== form.id);
        if (currentPinned) {
            const confirmReplace = window.confirm(
                `"${currentPinned.title}" is currently pinned. Do you want to unpin it and pin this one instead?`
            );
            if (!confirmReplace) return;
            return onSubmit(form, currentPinned);
        }
    }
    onSubmit(form);
}

function ModalContent({ form, update, setForm, fileRef, tags, error, onClose, onSubmit, isEdit }) {
    return (
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} isEdit={isEdit} />
            {error && <div className={styles.error}>{error}</div>}
            <FormFields form={form} update={update} setForm={setForm} fileRef={fileRef} tags={tags} />
            <ModalFooter onClose={onClose} onSubmit={() => onSubmit(form)} isEdit={isEdit} />
        </div>
    );
}

function ModalHeader({ onClose, isEdit }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>{isEdit ? "Edit Announcement" : "Add Announcement"}</h3>
            <button className={styles.close} onClick={onClose}>&times;</button>
        </div>
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

function ModalFooter({ onClose, onSubmit, isEdit }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.submitBtn} onClick={onSubmit}>
                {isEdit ? "Save Changes" : "Add Announcement"}
            </button>
        </div>
    );
}
