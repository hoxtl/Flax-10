import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTags } from '../../context/TagContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import StandardModal from '../common/StandardModal/StandardModal';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import styles from './TagManagerModal.module.css';

const PROTECTED_TAGS = ['other', 'lecture', 'deadline', 'exam', 'societies', 'schedule'];

function isProtectedTag(tagLabel) {
  return PROTECTED_TAGS.includes(tagLabel?.toLowerCase());
}


function useTagModal() {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const confirmFn = useConfirm();
  const toast = useToast();
  const { tags, addTag, updateTag, deleteTag } = useTags();

  const resetState = () => { setEditingId(null); setIsAdding(false); };

  const handleSave = async (data) => {
    await checkDuplicate(data, tags, editingId, confirmFn, updateTag, resetState, () => commitSave(data, editingId, updateTag, addTag, resetState));
  };

  const confirmDelete = async (id) => {
    const tag = tags.find(t => t.id === id);
    const yes = await confirmFn({ 
      title: "Delete Tag", 
      message: `Are you sure you want to delete "${tag?.label}"?`, 
      confirmText: "Delete", 
      cancelText: "Cancel",
      isDanger: true
    });
    if (!yes) return;
    const deleted = await deleteTag(id);
    if (deleted === false) {
      toast?.("Couldn't delete tag.", { variant: "error" });
      return;
    }
    toast?.(`"${tag?.label || "Tag"}" deleted.`);
  };

  return { tags, deleteTag: confirmDelete, editingId, setEditingId, isAdding, setIsAdding, handleSave, resetState };
}

async function checkDuplicate(data, tags, editingId, confirmFn, updateTag, resetState, onSafe) {
  const existing = tags.find(t => t.label.toLowerCase() === data.label.toLowerCase());
  if (existing && existing.id !== editingId) {
    const doReplace = await confirmFn({
      title: "Duplicate Tag Name",
      message: "A tag with this name already exists. What would you like to do?",
      confirmText: "Replace Existing",
      cancelText: "Cancel",
      isDanger: true
    });
    if (doReplace) {
      updateTag(existing.id, data);
      resetState();
    }
  } else {
    onSafe();
  }
}

function commitSave(data, editingId, updateTag, addTag, resetState) {
  if (editingId) updateTag(editingId, data);
  else addTag(data);
  resetState();
}

function ModalContent({ tags, editingId, isAdding, setEditingId, setIsAdding, onSave, onDelete, onCancel }) {
  if (editingId || isAdding) {
    const tag = editingId ? tags.find(t => t.id === editingId) : null;
    const initialData = tag || { label: '', color: '#000000' };
    return <TagForm initialData={initialData} onSave={onSave} onCancel={onCancel} isProtected={isProtectedTag(tag?.label)} />;
  }
  return <TagList tags={tags} onEdit={setEditingId} onDelete={onDelete} onAdd={() => setIsAdding(true)} />;
}

function TagForm({ initialData, onSave, onCancel, isProtected = false }) {
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (error) setError('');
  };

  const handleSaveClick = () => {
    const err = validateTagForm(form, isProtected);
    if (err) return setError(err);
    onSave(form);
  };

  return (
    <div className={`${styles.content} ${styles.form}`}>
      <TextInput label="Name" value={form.label} onChange={v => handleChange('label', v)} placeholder="e.g. Gym" disabled={isProtected} />
      <ColorInput value={form.color} onChange={v => handleChange('color', v)} />
      {error && <div className={styles.error}>{error}</div>}
      <FormActions onSave={handleSaveClick} onCancel={onCancel} />
    </div>
  );
}

function validateTagForm(form, isProtected) {
  if (!isProtected && !form.label.trim()) return "Name is required.";
  return '';
}

function TagList({ tags, onEdit, onDelete, onAdd }) {
  return (
    <div className={styles.content}>
      <div className={styles.list}>
        {tags.map(tag => <TagItem key={tag.id} tag={tag} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
      <PrimaryButton className={styles.addTagButton} variant="primary" onClick={onAdd} pill>+ Add New Tag</PrimaryButton>
    </div>
  );
}

function TagItem({ tag, onEdit, onDelete }) {
  return (
    <div className={styles.item}>
      <TagPreview tag={tag} />
      <TagActions id={tag.id} onEdit={onEdit} onDelete={onDelete} isProtected={isProtectedTag(tag.label)} />
    </div>
  );
}

function TagPreview({ tag }) {
  return (
    <div className={styles.preview} style={{ '--color': tag.color }}>
      <span className={styles.colorDot} style={{ backgroundColor: tag.color }} />
      <span>{tag.label}</span>
    </div>
  );
}

function TagActions({ id, onEdit, onDelete, isProtected }) {
  return (
    <div className={styles.actions}>
      <button type="button" onClick={() => onEdit(id)} aria-label="Edit tag"><Pencil size={14} strokeWidth={2} /></button>
      <button
        type="button"
        onClick={() => !isProtected && onDelete(id)}
        className={`${styles.delete} ${isProtected ? styles.deleteDisabled : ''}`}
        disabled={isProtected}
        aria-label="Delete tag"
        title={isProtected ? 'Default tags cannot be deleted' : 'Delete tag'}
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
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


function FormActions({ onSave, onCancel }) {
  return (
    <div className={styles.formActions}>
      <PrimaryButton type="button" variant="ghost" className={styles.formActionBtn} onClick={onCancel}>
        Cancel
      </PrimaryButton>
      <PrimaryButton type="button" variant="primary" className={styles.formActionBtn} onClick={onSave}>
        Save
      </PrimaryButton>
    </div>
  );
}

export default function TagManagerModal({ onClose }) {
  const logic = useTagModal();
  const { tags, deleteTag, editingId, setEditingId, isAdding, setIsAdding, handleSave, resetState } = logic;

  return (
    <StandardModal
      title="Manage Tags"
      onClose={onClose}
      size="sm"
      backdropClassName={styles.modalBackdrop}
      modalClassName={styles.modalShell}
      contentClassName={styles.modalContent}
    >
      <ModalContent tags={tags} editingId={editingId} isAdding={isAdding} setEditingId={setEditingId}
        setIsAdding={setIsAdding} onSave={handleSave} onDelete={deleteTag} onCancel={resetState} />
    </StandardModal>
  );
}
