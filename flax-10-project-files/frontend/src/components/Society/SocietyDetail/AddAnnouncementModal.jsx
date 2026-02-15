import { useState, useRef } from "react";
import styles from "./AddAnnouncementModal.module.css";

export default function AddAnnouncementModal({ onClose, onAdd }) {
    const [form, setForm] = useState({ title: "", content: "", image: null, addAsEvent: false });
    const fileRef = useRef(null);
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <FormFields form={form} update={update} fileRef={fileRef} />
                <ModalFooter onClose={onClose} onSubmit={() => onAdd(form)} disabled={!form.title.trim()} />
            </div>
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

function FormFields({ form, update, fileRef }) {
    return (
        <div className={styles.form}>
            <TitleField value={form.title} onChange={(v) => update("title", v)} />
            <ContentField value={form.content} onChange={(v) => update("content", v)} />
            <ImageField image={form.image} fileRef={fileRef} onChange={(v) => update("image", v)} />
            <EventToggle checked={form.addAsEvent} onChange={(v) => update("addAsEvent", v)} />
        </div>
    );
}

function TitleField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Announcement title" />
        </div>
    );
}

function ContentField({ value, onChange }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Content</label>
            <textarea className={styles.textarea} value={value} onChange={(e) => onChange(e.target.value)}
                placeholder="Write your announcement..." rows={4} />
        </div>
    );
}

function ImageField({ image, fileRef, onChange }) {
    const handleFile = (e) => handleFileSelect(e.target.files[0], onChange);

    return (
        <div className={styles.field}>
            <label className={styles.label}>Image (optional)</label>
            {image ? <ImagePreview src={image} onRemove={() => onChange(null)} /> : <ImageUpload fileRef={fileRef} onFile={handleFile} />}
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
        <div className={styles.imagePreview}>
            <img src={src} alt="Preview" />
            <button className={styles.removeBtn} onClick={onRemove}>&times;</button>
        </div>
    );
}

function EventToggle({ checked, onChange }) {
    return (
        <label className={styles.toggle}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>Also create as an event</span>
        </label>
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
