/**
 * TagEditCell - Tag selection cell for table view.
 * Displays tag badge with dropdown editor on click.
 */

import { Pencil } from 'lucide-react';
import AnimatedDropdown from '../../../common/animated_dropdown';
import styles from './TagEditCell.module.css';

function TagBadge({ name, color }) {
    const style = color ? { backgroundColor: color, color: 'white' } : {};
    return <span className={styles.tagBadge} style={style}>{name}</span>;
}

function buildTagOptions(tags) {
    return [
        { value: '', label: 'No tag' },
        ...tags.map(tag => ({ value: tag.id, label: tag.label }))
    ];
}

function TagDropdown({ tags, value, onSave }) {
    const options = buildTagOptions(tags);
    return (
        <AnimatedDropdown value={value || ''} onChange={onSave} options={options}
            placeholder="Select tag" menuMaxHeight={200} />
    );
}

function EmptyTagDisplay({ isReadOnly, onClick, isRowHovered }) {
    const cls = `${styles.tagEditIcon} ${isRowHovered ? styles.tagEditIconVisible : ''}`;
    return (
        <span className={styles.emptyTagCell} onClick={onClick}>
            {!isReadOnly && <Pencil size={14} className={cls} />}
        </span>
    );
}

function TagDisplay({ tagName, color, isReadOnly, onClick, isRowHovered }) {
    const cls = `${styles.tagEditIcon} ${isRowHovered ? styles.tagEditIconVisible : ''}`;
    return (
        <span className={styles.tagCellContent} onClick={onClick}>
            <TagBadge name={tagName} color={color} />
            {!isReadOnly && <Pencil size={10} className={cls} />}
        </span>
    );
}

export function TagEditCell({ event, tags, theme, isReadOnly, isEditing, editValue, onEdit, onSave, isRowHovered }) {
    const tagName = event.tag_name || event.tag?.name;
    const handleClick = (e) => { if (!isReadOnly && onEdit) onEdit(e); };
    const common = { isReadOnly, onClick: handleClick, isRowHovered };

    if (isEditing && !isReadOnly) return <TagDropdown tags={tags} value={editValue} onSave={onSave} />;
    if (!tagName) return <EmptyTagDisplay {...common} />;
    return <TagDisplay tagName={tagName} color={theme.color} {...common} />;
}
