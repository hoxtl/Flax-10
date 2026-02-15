import { useState, useRef } from "react";
import styles from "./AnnouncementModal.module.css";

const MAX_IMAGES = 5;

export default function AnnouncementModal({ onClose, onSubmit, tags = [], announcement = null }) {
    const isEdit = !!announcement;
    const [form, setForm] = useState(getInitialForm(announcement));
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <ModalContent form={form} update={update} fileRef={fileRef} tags={tags}
                onClose={onClose} onSubmit={() => onSubmit(form)} isEdit={isEdit} />
        </div>
    );
}

function getInitialForm(announcement) {
    if (!announcement) return { title: "", content: "", images: [], tagId: null, addAsEvent: false, allDay: false, date: "", startTime: "", endTime: "", pinned: false };
    return { title: announcement.title, content: announcement.content, images: announcement.images || (announcement.image ? [announcement.image] : []),
        tagId: announcement.tagId || null, addAsEvent: false, allDay: false, date: "", startTime: "", endTime: "", pinned: announcement.pinned || false, id: announcement.id };
}

function ModalContent({ form, update, fileRef, tags, onClose, onSubmit, isEdit }) {
    return (
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} isEdit={isEdit} />
            <FormFields form={form} update={update} fileRef={fileRef} tags={tags} />
            <ModalFooter onClose={onClose} onSubmit={onSubmit} disabled={!form.title.trim()} isEdit={isEdit} />
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

function FormFields({ form, update, fileRef, tags }) {
    return (
        <div className={styles.form}>
            <TextField label="Title *" value={form.title} onChange={(v) => update("title", v)} placeholder="Announcement title" />
            <TextAreaField label="Description" value={form.content} onChange={(v) => update("content", v)} placeholder="Write your announcement..." />
            {tags.length > 0 && <TagSelect tags={tags} value={form.tagId} onChange={(v) => update("tagId", v)} />}
            <ImagesField images={form.images} fileRef={fileRef} onChange={(v) => update("images", v)} />
            <ToggleField label="Pin this announcement" checked={form.pinned} onChange={(v) => update("pinned", v)} />
            <EventSection form={form} update={update} />
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}

function TextAreaField({ label, value, onChange, placeholder }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <textarea className={styles.textarea} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
        </div>
    );
}

function TagSelect({ tags, value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Tag (optional)</label>
            <select className={styles.select} value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">No tag</option>
                {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.icon} {tag.label}</option>)}
            </select>
        </div>
    );
}

function ImagesField({ images, fileRef, onChange }) {
    const canAddMore = images.length < MAX_IMAGES;
    const addImage = (src) => onChange([...images, src]);
    const removeImage = (index) => onChange(images.filter((_, i) => i !== index));

    return (
        <div className={styles.field}>
            <label className={styles.label}>Images ({images.length}/{MAX_IMAGES})</label>
            <ImagesGrid images={images} onRemove={removeImage} canAdd={canAddMore} fileRef={fileRef} onAdd={addImage} />
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

function handleFileSelect(file, onAdd, fileRef) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { onAdd(e.target.result); if (fileRef.current) fileRef.current.value = ""; };
    reader.readAsDataURL(file);
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

function EventSection({ form, update }) {
    return (
        <div className={styles.eventSection}>
            <ToggleField label="Also add as event" checked={form.addAsEvent} onChange={(v) => update("addAsEvent", v)} />
            {form.addAsEvent && <EventFields form={form} update={update} />}
        </div>
    );
}

function EventFields({ form, update }) {
    return (
        <div className={styles.eventFields}>
            <ToggleField label="All day" checked={form.allDay} onChange={(v) => update("allDay", v)} />
            <DateField value={form.date} onChange={(v) => update("date", v)} />
            {!form.allDay && <TimeFields form={form} update={update} />}
        </div>
    );
}

function DateField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <input className={styles.input} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function TimeFields({ form, update }) {
    return (
        <div className={styles.timeRow}>
            <TimeField label="Start" value={form.startTime} onChange={(v) => update("startTime", v)} />
            <TimeField label="End" value={form.endTime} onChange={(v) => update("endTime", v)} />
        </div>
    );
}

function TimeField({ label, value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <input className={styles.input} type="time" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function ModalFooter({ onClose, onSubmit, disabled, isEdit }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.submitBtn} onClick={onSubmit} disabled={disabled}>
                {isEdit ? "Save Changes" : "Add Announcement"}
            </button>
        </div>
    );
}
