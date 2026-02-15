import { useState, useRef } from "react";
import styles from "./AddAnnouncementModal.module.css";

const INITIAL_FORM = {
    title: "", content: "", image: null, tagId: null,
    addAsEvent: false, allDay: false, date: "", startTime: "", endTime: ""
};

export default function AddAnnouncementModal({ onClose, onAdd, tags = [] }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <ModalContent form={form} update={update} fileRef={fileRef} tags={tags} onClose={onClose} onAdd={onAdd} />
        </div>
    );
}

function ModalContent({ form, update, fileRef, tags, onClose, onAdd }) {
    return (
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} />
            <FormFields form={form} update={update} fileRef={fileRef} tags={tags} />
            <ModalFooter onClose={onClose} onSubmit={() => onAdd(form)} disabled={!form.title.trim()} />
        </div>
    );
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>Add Announcement</h3>
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
            <ImageField image={form.image} fileRef={fileRef} onChange={(v) => update("image", v)} />
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

function ImageField({ image, fileRef, onChange }) {
    const handleFile = (e) => handleFileSelect(e.target.files[0], onChange);
    if (image) return <ImagePreview src={image} onRemove={() => onChange(null)} />;

    return (
        <div className={styles.field}>
            <label className={styles.label}>Image (optional)</label>
            <ImageUpload fileRef={fileRef} onFile={handleFile} />
        </div>
    );
}

function handleFileSelect(file, setImage) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
}

function ImageUpload({ fileRef, onFile }) {
    return (
        <div className={styles.imageUpload} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
            <span>+ Add image</span>
        </div>
    );
}

function ImagePreview({ src, onRemove }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Image</label>
            <div className={styles.imagePreview}>
                <img src={src} alt="Preview" />
                <button className={styles.removeBtn} onClick={onRemove}>&times;</button>
            </div>
        </div>
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

function ToggleField({ label, checked, onChange }) {
    return (
        <label className={styles.toggle}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
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

function ModalFooter({ onClose, onSubmit, disabled }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.submitBtn} onClick={onSubmit} disabled={disabled}>Add Announcement</button>
        </div>
    );
}
