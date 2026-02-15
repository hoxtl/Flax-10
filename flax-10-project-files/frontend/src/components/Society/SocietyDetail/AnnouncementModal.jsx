import { useState, useRef } from "react";
import styles from "./AnnouncementModal.module.css";

const MAX_IMAGES = 5;
const RECURRENCE_OPTIONS = [
    { value: "", label: "Does not repeat" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
];

export default function AnnouncementModal({ onClose, onSubmit, tags = [], announcement = null }) {
    const isEdit = !!announcement;
    const [form, setForm] = useState(getInitialForm(announcement));
    const [error, setError] = useState("");
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = () => {
        const validationError = validateForm(form);
        if (validationError) { setError(validationError); return; }
        onSubmit(form);
    };

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <ModalContent form={form} update={update} fileRef={fileRef} tags={tags} error={error}
                onClose={onClose} onSubmit={handleSubmit} isEdit={isEdit} />
        </div>
    );
}

function validateForm(form) {
    if (!form.title.trim()) return "Title is required";
    if (!form.addAsEvent) return null;
    if (!form.date) return "Date is required when adding as event";
    if (!form.allDay && !form.startTime) return "Start time is required";
    if (form.endDate && form.endDate < form.date) return "End date must be after start date";
    return null;
}

function getInitialForm(announcement) {
    const base = { title: "", content: "", images: [], tagId: null, addAsEvent: false, allDay: false,
        date: "", endDate: "", startTime: "", endTime: "", recurrence: "", pinned: false };
    if (!announcement) return base;
    return { ...base, title: announcement.title, content: announcement.content, tagId: announcement.tagId || null,
        images: announcement.images || (announcement.image ? [announcement.image] : []), pinned: announcement.pinned || false, id: announcement.id };
}

function ModalContent({ form, update, fileRef, tags, error, onClose, onSubmit, isEdit }) {
    return (
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} isEdit={isEdit} />
            {error && <div className={styles.error}>{error}</div>}
            <FormFields form={form} update={update} fileRef={fileRef} tags={tags} />
            <ModalFooter onClose={onClose} onSubmit={onSubmit} isEdit={isEdit} />
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
    const selectedTag = tags.find(t => t.id === value);
    return (
        <div className={styles.field}>
            <label className={styles.label}>Tag (optional)</label>
            <div className={styles.selectWrapper}>
                {selectedTag && <span className={styles.colorDot} style={{ backgroundColor: selectedTag.color }} />}
                <select className={styles.select} value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
                    <option value="">No tag</option>
                    {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
                </select>
            </div>
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
            <DateRow form={form} update={update} />
            {!form.allDay && <TimeFields form={form} update={update} />}
            <RecurrenceField value={form.recurrence} onChange={(v) => update("recurrence", v)} />
        </div>
    );
}

function DateRow({ form, update }) {
    return (
        <div className={styles.dateRow}>
            <DateField label="Start Date *" value={form.date} onChange={(v) => update("date", v)} />
            <DateField label="End Date" value={form.endDate} onChange={(v) => update("endDate", v)} min={form.date} />
        </div>
    );
}

function DateField({ label, value, onChange, min }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <input className={styles.input} type="date" value={value} onChange={(e) => onChange(e.target.value)} min={min} />
        </div>
    );
}

function TimeFields({ form, update }) {
    return (
        <div className={styles.timeRow}>
            <TimeField label="Start Time *" value={form.startTime} onChange={(v) => update("startTime", v)} />
            <TimeField label="End Time" value={form.endTime} onChange={(v) => update("endTime", v)} />
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

function RecurrenceField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Repeat</label>
            <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
                {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function ModalFooter({ onClose, onSubmit, isEdit }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.submitBtn} onClick={onSubmit}>{isEdit ? "Save Changes" : "Add Announcement"}</button>
        </div>
    );
}
