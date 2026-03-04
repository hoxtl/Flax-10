import { useState } from 'react';
import { useTags } from '../../context/TagContext';
import EmojiPicker from './EmojiPicker';
import styles from './TagManagerModal.module.css';

function isIconValid(icon) {
  if (!icon) return false;
  const hasEmoji = /\p{Extended_Pictographic}/u.test(icon);
  return hasEmoji && !/^[a-zA-Z0-9]+$/.test(icon);
}

function useTagModal() {
  const { tags, addTag, updateTag, deleteTag } = useTags();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const resetState = () => { setEditingId(null); setIsAdding(false); };
  const handleSave = (data) => { if (editingId) updateTag(editingId, data); else addTag(data); resetState(); };
  return { tags, deleteTag, editingId, setEditingId, isAdding, setIsAdding, handleSave, resetState };
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
    const tag = editingId ? tags.find(t => t.id === editingId) : null;
    const initialData = tag || { label: '', color: '#000000', icon: '' };
    const isDefault = tag?.label?.toLowerCase() === 'other';
    return <TagForm initialData={initialData} onSave={onSave} onCancel={onCancel} isDefault={isDefault} />;
  }
  return <TagList tags={tags} onEdit={setEditingId} onDelete={onDelete} onAdd={() => setIsAdding(true)} />;
}

function TagForm({ initialData, onSave, onCancel, isDefault = false }) {
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (error) setError('');
  };

  const handleSaveClick = () => {
    const err = validateTagForm(form, isDefault);
    if (err) return setError(err);
    onSave(form);
  };

  return (
    <div className={`${styles.content} ${styles.form}`}>
      <TextInput label="Name" value={form.label} onChange={v => handleChange('label', v)} placeholder="e.g. Gym" disabled={isDefault} />
      {!isDefault && <ColorInput value={form.color} onChange={v => handleChange('color', v)} />}
      <EmojiInput value={form.icon} onChange={v => handleChange('icon', v)} />
      {error && <div className={styles.error}>{error}</div>}
      <FormActions onSave={handleSaveClick} onCancel={onCancel} />
    </div>
  );
}

function validateTagForm(form, isDefault) {
  if (!isDefault && !form.label.trim()) return "Name is required.";
  if (!form.icon) return "Icon is required.";
  if (!isIconValid(form.icon)) return "Only emojis allowed.";
  return '';
}

function TagList({ tags, onEdit, onDelete, onAdd }) {
  return (
    <div className={styles.content}>
      <div className={styles.list}>
        {tags.map(tag => <TagItem key={tag.id} tag={tag} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
      <button className={styles.addBtn} onClick={onAdd}>+ Add New Tag</button>
    </div>
  );
}

function TagItem({ tag, onEdit, onDelete }) {
  const isOther = tag.label?.toLowerCase() === 'other';
  return (
    <div className={styles.item}>
      <TagPreview tag={tag} />
      <TagActions id={tag.id} onEdit={onEdit} onDelete={onDelete} isDeletable={!isOther} />
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

function TagActions({ id, onEdit, onDelete, isDeletable }) {
  return (
    <div className={styles.actions}>
      <button onClick={() => onEdit(id)}>✎</button>
      {isDeletable && <button onClick={() => onDelete(id)} className={styles.delete}>🗑</button>}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <label>
      {label}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </label>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <label>Color
      <div className={styles.colorRow}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
        <span style={{ color: value }}>{value}</span>
      </div>
    </label>
  );
}

function EmojiInput({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <label className={styles.emojiInputWrapper}>
      Icon (Emoji)
      <div className={styles.emojiInputRow}>
        <button type="button" className={styles.emojiPreviewBtn} onClick={() => setShowPicker(!showPicker)}>
          {value || '😀'}
        </button>
        <span className={styles.emojiHint}>{value ? 'Click to change' : 'Click to select'}</span>
      </div>
      {showPicker && <EmojiPicker onSelect={onChange} onClose={() => setShowPicker(false)} />}
    </label>
  );
}

function FormActions({ onSave, onCancel }) {
  return (
    <div className={styles.formActions}>
      <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
      <button className={styles.saveBtn} onClick={onSave}>Save</button>
    </div>
  );
}

export default function TagManagerModal({ onClose }) {
  const { tags, deleteTag, editingId, setEditingId, isAdding, setIsAdding, handleSave, resetState } = useTagModal();
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ModalHeader onClose={onClose} />
        <ModalContent tags={tags} editingId={editingId} isAdding={isAdding} setEditingId={setEditingId}
          setIsAdding={setIsAdding} onSave={handleSave} onDelete={deleteTag} onCancel={resetState} />
      </div>
    </div>
  );
}
