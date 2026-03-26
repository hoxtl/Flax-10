/**
 * TagManager allows society admins to define, color-code, and delete
 * custom tags for categorizing society events and announcements.
 */

import { useState } from "react";
import styles from "./TagManager.module.css";

const DEFAULT_COLORS = ["var(--color-light-blue)", "var(--color-error)", "var(--gw-priority-low)", "var(--color-amber)", "var(--chart-accent-purple)", "var(--chart-accent-pink)", "var(--color-teal)", "var(--chart-accent-amber)"];
const MAX_TAGS = 7;

const isDuplicateTag = (tags, label) =>
    tags.some(t => t.label.toLowerCase() === label.toLowerCase());

const makeHandleAdd = (tags, newTag, setNewTag, setError, onAddTag) =>
    async () => {
        const label = newTag.label.trim();
        if (isDuplicateTag(tags, label)) return setError("A tag with this name already exists.");
        const data = { label, color: newTag.color };
        if (await onAddTag?.(data)) {
            setNewTag({ label: "", color: getNextColor([...tags, data]) });
            setError(null);
        }
    };

export default function TagManager({ tags = [], onAddTag, onDeleteTag }) {
    const [newTag, setNewTag] = useState({ label: "", color: getNextColor(tags) });
    const [error, setError] = useState(null);
    const handleAdd = makeHandleAdd(tags, newTag, setNewTag, setError, onAddTag);

    return (
        <div className={styles.manager}>
            <ManagerHeader count={tags.length} max={MAX_TAGS} />
            <TagList tags={tags} onRemove={onDeleteTag} />
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

function TagList({ tags, onRemove }) {
    if (tags.length === 0) return <p className={styles.empty}>No tags yet. Add one below.</p>;
    return (
        <div className={styles.tagList}>
            {tags.map(tag => <TagItem key={tag.id} tag={tag} onRemove={() => onRemove(tag.id)} />)}
        </div>
    );
}

function TagItem({ tag, onRemove }) {
    return (
        <div className={styles.tagItem}>
            <span className={styles.colorDot} style={{ backgroundColor: tag.color }} />
            <span className={styles.tagLabel}>{tag.label}</span>
            <button className={styles.removeBtn} onClick={onRemove}>&times;</button>
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
                    style={{ backgroundColor: c }} onClick={() => onChange(c)} />
            ))}
            <CustomColorInput color={color} onChange={onChange} />
        </div>
    );
}

function CustomColorInput({ color, onChange }) {
    const isCustom = !DEFAULT_COLORS.includes(color);
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
