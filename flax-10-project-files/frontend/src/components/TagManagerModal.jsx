import { useState } from 'react';
import { useTags } from '../context/TagContext';
import styles from './TagManagerModal.module.css';

export default function TagManagerModal({ onClose }) {
    const { tags, addTag, updateTag, deleteTag } = useTags();
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSave = (data) => {
        if (editingId) updateTag(editingId, data);
        else addTag(data);
        resetState();
    };

    const resetState = () => {
        setEditingId(null);
        setIsAdding(false);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <ModalContent
                    tags={tags} editingId={editingId} isAdding={isAdding}
                    setEditingId={setEditingId} setIsAdding={setIsAdding}
                    onSave={handleSave} onDelete={deleteTag} onCancel={resetState}
                />
            </div>
        </div>
    );
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h3>Manage Tags</h3>
            <button className={styles.close} onClick={onClose}>×</button>
        </div>
    );
}

function ModalContent({ tags, editingId, isAdding, setEditingId, setIsAdding, onSave, onDelete, onCancel }) {
    if (editingId || isAdding) {
        const initialData = editingId ? tags.find(t => t.id === editingId) : { label: '', color: '#000000', icon: '⭐' };
        return <TagForm initialData={initialData} onSave={onSave} onCancel={onCancel} />;
    }
    return <TagList tags={tags} onEdit={setEditingId} onDelete={onDelete} onAdd={() => setIsAdding(true)} />;
}

function TagList({ tags, onEdit, onDelete, onAdd }) {
    return (
        <div className={styles.content}>
            <div className={styles.list}>
                {tags.map(tag => (
                    <TagItem key={tag.id} tag={tag} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
            <button className={styles.addBtn} onClick={onAdd}>+ Add New Tag</button>
        </div>
    );
}

function TagItem({ tag, onEdit, onDelete }) {
    return (
        <div className={styles.item}>
            <TagPreview tag={tag} />
            <TagActions id={tag.id} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}

function TagPreview({ tag }) {
    return (
        <div className={styles.preview} style={{ '--color': tag.color }}>
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
        </div>
    );
}

function TagActions({ id, onEdit, onDelete }) {
    return (
        <div className={styles.actions}>
            <button onClick={() => onEdit(id)}>✎</button>
            <button onClick={() => onDelete(id)} className={styles.delete}>🗑</button>
        </div>
    );
}

function TagForm({ initialData, onSave, onCancel }) {
    const [form, setForm] = useState(initialData);
    const isValid = form.label && form.icon;

    return (
        <div className={`${styles.content} ${styles.form}`}>
            <TextInput label="Name" value={form.label} onChange={v => setForm({ ...form, label: v })} placeholder="e.g. Gym" />
            <ColorInput value={form.color} onChange={v => setForm({ ...form, color: v })} />
            <TextInput label="Icon (Emoji)" value={form.icon} onChange={v => setForm({ ...form, icon: v })} placeholder="e.g. 🏋️" />
            <FormActions onSave={() => onSave(form)} onCancel={onCancel} disabled={!isValid} />
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder }) {
    return (
        <label>
            {label}
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </label>
    );
}

function ColorInput({ value, onChange }) {
    return (
        <label>
            Color
            <div className={styles.colorRow}>
                <input type="color" value={value} onChange={e => onChange(e.target.value)} />
                <span style={{ color: value }}>{value}</span>
            </div>
        </label>
    );
}

function FormActions({ onSave, onCancel, disabled }) {
    return (
        <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button className={styles.saveBtn} onClick={onSave} disabled={disabled}>Save</button>
        </div>
    );
}
