/**
 * TagManager allows society admins to define, color-code, and delete
 * custom tags for categorizing society events and announcements.
 */

import { useState } from "react";
import styles from "./TagManager.module.css";
import selectorStyles from "../../../common/tags_selector/TagsSelector.module.css";

const DEFAULT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#9C27B0", "#ec4899", "#10b981", "#FFD54F"];
const MAX_TAGS = 7;

const isDuplicateTag = (tags, label, excludeId = null) =>
    tags.some(t => t.id !== excludeId && t.label.toLowerCase() === label.toLowerCase());

const makeHandleAdd = (tags, newTag, setNewTag, setError, onAddTag) =>
    async () => {
        const label = newTag.label.trim();
        if (!label) return;
        if (isDuplicateTag(tags, label)) return setError("A tag with this name already exists.");
        const data = { label, color: newTag.color };
        try {
            const result = await onAddTag?.(data);
            if (result) {
                setNewTag({ label: "", color: getNextColor([...tags, data]) });
                setError(null);
            }
        } catch (err) {
            setError(err?.message || "Failed to add tag. Please try again.");
        }
    };

export default function TagManager({ tags = [], onAddTag, onDeleteTag, onUpdateTag }) {
    const [newTag, setNewTag] = useState({ label: "", color: getNextColor(tags) });
    const [error, setError] = useState(null);
    const handleAdd = makeHandleAdd(tags, newTag, setNewTag, setError, onAddTag);

    return (
        <div className={styles.manager}>
            <ManagerHeader count={tags.length} max={MAX_TAGS} />
            <TagList tags={tags} onRemove={onDeleteTag} onUpdateTag={onUpdateTag} />
            {tags.length < MAX_TAGS && <AddTagForm newTag={newTag} setNewTag={setNewTag} onAdd={handleAdd} error={error} setError={setError} />}
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
    return (
        <div className={styles.tagList}>
            {tags.map(tag => <EditableTagItem key={tag.id} tag={tag} tags={tags} onRemove={() => onRemove(tag.id)} onUpdateTag={onUpdateTag} />)}
        </div>
    );
}

function EditableTagItem({ tag, tags, onRemove, onUpdateTag }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ label: tag.label, color: tag.color });
    const [error, setError] = useState("");

    const saveEdit = async () => {
        const label = draft.label.trim();
        if (!label) return setError("Give the tag a name.");
        if (isDuplicateTag(tags, label, tag.id)) return setError("A tag with this name already exists.");
        await onUpdateTag?.(tag.id, { label, color: draft.color });
        setError("");
        setEditing(false);
    };

    if (editing) {
        return (
            <div className={styles.tagEditor}>
                <input
                    className={styles.tagEditorInput}
                    value={draft.label}
                    onChange={(event) => { setDraft(prev => ({ ...prev, label: event.target.value })); setError(""); }}
                    onKeyDown={(event) => event.key === "Enter" && saveEdit()}
                    autoFocus
                />
                <ColorPicker color={draft.color} onChange={(color) => setDraft(prev => ({ ...prev, color }))} />
                <button className={styles.tagEditorBtn} onClick={saveEdit} type="button">Save</button>
                <button className={styles.tagEditorGhostBtn} onClick={() => { setDraft({ label: tag.label, color: tag.color }); setEditing(false); setError(""); }} type="button">Cancel</button>
                {error && <p className={styles.error}>{error}</p>}
            </div>
        );
    }

    return (
        <div className={styles.tagItem}>
            <button className={`${selectorStyles.selectedTag} ${styles.tagChip}`.trim()} onClick={() => setEditing(true)} type="button">
                {tag.color && <span className={selectorStyles.tagDot} style={{ backgroundColor: tag.color }} aria-hidden="true" />}
                <span className={selectorStyles.tagLabel}>{tag.label}</span>
            </button>
            <button className={styles.removeBtn} onClick={(event) => { event.stopPropagation(); onRemove(); }} type="button">&times;</button>
        </div>
    );
}

function AddTagForm({ newTag, setNewTag, onAdd, error, setError }) {
    const handleChange = (e) => {
        setNewTag(prev => ({ ...prev, label: e.target.value }));
        setError(null);
    };
    return (
        <div className={styles.addForm}>
            <input className={styles.input} placeholder="Tag name" value={newTag.label}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && onAdd()} />
            <ColorPicker color={newTag.color} onChange={(c) => setNewTag(prev => ({ ...prev, color: c }))} />
            <button className={styles.addBtn} onClick={onAdd} disabled={!newTag.label.trim()}>Add</button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

function ColorPicker({ color, onChange }) {
    return (
        <div className={styles.colorPicker}>
            {DEFAULT_COLORS.map(c => (
                <button key={c} className={`${styles.colorOption} ${c === color ? styles.selected : ""}`}
                    style={{ backgroundColor: c }} onClick={() => onChange(c)} type="button" />
            ))}
            <CustomColorInput color={color} onChange={onChange} />
        </div>
    );
}

function CustomColorInput({ color, onChange }) {
    const isCustom = Boolean(color) && !DEFAULT_COLORS.includes(color);
    const inputValue = isCustom ? color : ["#", "000000"].join("");
    return (
        <label className={`${styles.customColor} ${isCustom ? styles.selected : ""}`}>
            <input type="color" value={inputValue} onChange={(e) => onChange(e.target.value)} />
        </label>
    );
}

function getNextColor(tags) {
    const usedColors = new Set(tags.map(t => t.color));
    return DEFAULT_COLORS.find(c => !usedColors.has(c)) || DEFAULT_COLORS[0];
}
