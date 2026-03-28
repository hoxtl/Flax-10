/**
 * TagManager allows society admins to define, color-code, and delete
 * custom tags for categorizing society events and announcements.
 */

import { useState } from "react";
import styles from "./TagManager.module.css";
import selectorStyles from "../../../common/tags_selector/TagsSelector.module.css";

const DEFAULT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#9C27B0", "#ec4899", "#10b981", "#FFD54F"];
const MAX_TAGS = 7;

function getNextColor(tags) {
    const usedColors = new Set(tags.map((tag) => tag.color));
    return DEFAULT_COLORS.find((color) => !usedColors.has(color)) || DEFAULT_COLORS[0];
}

function getInitialNewTag(tags) {
    return { label: "", color: getNextColor(tags) };
}

function isDuplicateTag(tags, label, excludeId = null) {
    return tags.some((tag) => tag.id !== excludeId && tag.label.toLowerCase() === label.toLowerCase());
}

function getTagError(tags, label, excludeId = null) {
    if (!label) return "Give the tag a name.";
    if (isDuplicateTag(tags, label, excludeId)) return "A tag with this name already exists.";
    return "";
}

async function addTagSafely(onAddTag, data) {
    try {
        return { result: await onAddTag?.(data), error: null };
    } catch (error) {
        return { result: null, error: error?.message || "Failed to add tag. Please try again." };
    }
}

function useAddTagForm(tags, onAddTag) {
    const [newTag, setNewTag] = useState(getInitialNewTag(tags));
    const [error, setError] = useState(null);

    async function handleAdd() {
        const label = newTag.label.trim();
        const nextError = getTagError(tags, label);
        if (nextError) return setError(nextError);
        const { result, error: saveError } = await addTagSafely(onAddTag, { label, color: newTag.color });
        if (saveError) return setError(saveError);
        if (!result) return;
        setNewTag(getInitialNewTag([...tags, { label, color: newTag.color }]));
        setError(null);
    }

    return { newTag, setNewTag, error, setError, handleAdd };
}

/** Manages the tag editor surface for society-specific labels. */
export default function TagManager({ tags = [], onAddTag, onDeleteTag, onUpdateTag }) {
    const form = useAddTagForm(tags, onAddTag);
    return (
        <div className={styles.manager}>
            <ManagerHeader count={tags.length} max={MAX_TAGS} />
            <TagList tags={tags} onRemove={onDeleteTag} onUpdateTag={onUpdateTag} />
            {tags.length < MAX_TAGS && <AddTagForm {...form} />}
        </div>
    );
}

function ManagerHeader({ count, max }) {
    return (
        <div className={styles.headerRow}>
            <h4 className={styles.title}>Manage Tags</h4>
            <span className={styles.counter}>{count}/{max}</span>
        </div>
    );
}

function TagList({ tags, onRemove, onUpdateTag }) {
    if (tags.length === 0) return <p className={styles.empty}>No tags yet. Add one below.</p>;
    return <div className={styles.tagList}>{tags.map((tag) => <EditableTagItem key={tag.id} tag={tag} tags={tags} onRemove={() => onRemove(tag.id)} onUpdateTag={onUpdateTag} />)}</div>;
}

function useTagEditor(tag) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ label: tag.label, color: tag.color });
    const [error, setError] = useState("");
    const reset = () => {
        setDraft({ label: tag.label, color: tag.color });
        setEditing(false);
        setError("");
    };
    return { editing, setEditing, draft, setDraft, error, setError, reset };
}

async function saveEditedTag(tag, tags, editor, onUpdateTag) {
    const label = editor.draft.label.trim();
    const nextError = getTagError(tags, label, tag.id);
    if (nextError) return editor.setError(nextError);
    await onUpdateTag?.(tag.id, { label, color: editor.draft.color });
    editor.setError("");
    editor.setEditing(false);
}

function EditableTagItem({ tag, tags, onRemove, onUpdateTag }) {
    const editor = useTagEditor(tag);
    if (editor.editing) return <EditableTagEditor tag={tag} editor={editor} onSave={() => saveEditedTag(tag, tags, editor, onUpdateTag)} />;
    return <EditableTagDisplay tag={tag} onEdit={() => editor.setEditing(true)} onRemove={onRemove} />;
}

function EditableTagEditor({ tag, editor, onSave }) {
    return (
        <div className={styles.tagEditor}>
            <TagEditorInput editor={editor} onSave={onSave} />
            <ColorPicker color={editor.draft.color} onChange={(color) => setDraftColor(editor, color)} />
            <button className={styles.tagEditorBtn} onClick={onSave} type="button">Save</button>
            <button className={styles.tagEditorGhostBtn} onClick={editor.reset} type="button">Cancel</button>
            {editor.error && <p className={styles.error}>{editor.error}</p>}
        </div>
    );
}

function TagEditorInput({ editor, onSave }) {
    return <input className={styles.tagEditorInput} value={editor.draft.label} onChange={(event) => setDraftLabel(editor, event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSave()} autoFocus />;
}

function setDraftLabel(editor, label) {
    editor.setDraft((current) => ({ ...current, label }));
    editor.setError("");
}

function setDraftColor(editor, color) {
    editor.setDraft((current) => ({ ...current, color }));
}

function EditableTagDisplay({ tag, onEdit, onRemove }) {
    return (
        <div className={styles.tagItem}>
            <button className={`${selectorStyles.selectedTag} ${styles.tagChip}`.trim()} onClick={onEdit} type="button">
                {tag.color && <span className={selectorStyles.tagDot} style={{ backgroundColor: tag.color }} aria-hidden="true" />}
                <span className={selectorStyles.tagLabel}>{tag.label}</span>
            </button>
            <button className={styles.removeBtn} onClick={(event) => handleTagRemove(event, onRemove)} type="button">&times;</button>
        </div>
    );
}

function handleTagRemove(event, onRemove) {
    event.stopPropagation();
    onRemove();
}

function AddTagForm({ newTag, setNewTag, handleAdd, error, setError }) {
    return (
        <div className={styles.addForm}>
            <AddTagInput newTag={newTag} setNewTag={setNewTag} setError={setError} onAdd={handleAdd} />
            <ColorPicker color={newTag.color} onChange={(color) => setNewTag((current) => ({ ...current, color }))} />
            <button className={styles.addBtn} onClick={handleAdd} disabled={!newTag.label.trim()}>Add</button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

function AddTagInput({ newTag, setNewTag, setError, onAdd }) {
    return <input className={styles.input} placeholder="Tag name" value={newTag.label} onChange={(event) => handleNewTagChange(event, setNewTag, setError)} onKeyDown={(event) => event.key === "Enter" && onAdd()} />;
}

function handleNewTagChange(event, setNewTag, setError) {
    setNewTag((current) => ({ ...current, label: event.target.value }));
    setError(null);
}

function ColorPicker({ color, onChange }) {
    return (
        <div className={styles.colorPicker}>
            {DEFAULT_COLORS.map((option) => <ColorOption key={option} color={option} selected={option === color} onChange={onChange} />)}
            <CustomColorInput color={color} onChange={onChange} />
        </div>
    );
}

function ColorOption({ color, selected, onChange }) {
    return <button key={color} className={`${styles.colorOption} ${selected ? styles.selected : ""}`} style={{ backgroundColor: color }} onClick={() => onChange(color)} type="button" />;
}

function CustomColorInput({ color, onChange }) {
    const isCustom = Boolean(color) && !DEFAULT_COLORS.includes(color);
    const inputValue = isCustom ? color : "#000000";
    return <label className={`${styles.customColor} ${isCustom ? styles.selected : ""}`}><input type="color" value={inputValue} onChange={(event) => onChange(event.target.value)} /></label>;
}
