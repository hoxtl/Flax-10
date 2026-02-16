import { useState, useRef } from "react";
import styles from "./AddPhotoModal.module.css";

export default function AddPhotoModal({ onClose, onAdd }) {
    const [preview, setPreview] = useState(null);
    const [addToCover, setAddToCover] = useState(false);
    const fileRef = useRef(null);

    const handleFile = (e) => handleFileSelect(e.target.files[0], setPreview);
    const handleSubmit = () => { if (preview) onAdd({ url: preview, addToCover }); };

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <ModalContent fileRef={fileRef} preview={preview} addToCover={addToCover}
                setAddToCover={setAddToCover} onFile={handleFile} onSubmit={handleSubmit} onClose={onClose} />
        </div>
    );
}

function handleFileSelect(file, setPreview) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
}

function ModalContent({ fileRef, preview, addToCover, setAddToCover, onFile, onSubmit, onClose }) {
    return (
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} />
            <UploadArea fileRef={fileRef} preview={preview} onFile={onFile} />
            {preview && <CoverOption checked={addToCover} onChange={setAddToCover} />}
            <ModalFooter onClose={onClose} onSubmit={onSubmit} disabled={!preview} />
        </div>
    );
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>Add Photo</h3>
            <button className={styles.close} onClick={onClose}>&times;</button>
        </div>
    );
}

function UploadArea({ fileRef, preview, onFile }) {
    if (preview) return <PreviewImage src={preview} onRemove={() => fileRef.current && (fileRef.current.value = "")} />;
    return <DropZone fileRef={fileRef} onFile={onFile} />;
}

function DropZone({ fileRef, onFile }) {
    return (
        <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
            <span className={styles.dropIcon}>+</span>
            <span className={styles.dropText}>Click to upload or drag an image</span>
        </div>
    );
}

function PreviewImage({ src }) {
    return <img className={styles.preview} src={src} alt="Preview" />;
}

function CoverOption({ checked, onChange }) {
    return (
        <label className={styles.coverOption}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>Also add to cover images</span>
        </label>
    );
}

function ModalFooter({ onClose, onSubmit, disabled }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.submitBtn} onClick={onSubmit} disabled={disabled}>Add Photo</button>
        </div>
    );
}
