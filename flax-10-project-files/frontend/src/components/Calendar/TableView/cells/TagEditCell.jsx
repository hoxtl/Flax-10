/**
 * TagEditCell - Tag selection cell for table view.
 * Displays tag badge with dropdown editor on click.
 */
import { Pencil } from 'lucide-react';
import AnimatedDropdown from '../../../common/AnimatedDropdown';
import styles from '../TableView.module.css';

function TagBadge({ name }) {
    return <span className={styles.tagBadge}>{name}</span>;
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

function EmptyTagDisplay({ isReadOnly, onClick }) {
    return (
        <span className={styles.emptyTagCell} onClick={onClick}>
            {!isReadOnly && <Pencil size={14} className={styles.editIcon} />}
        </span>
    );
}

function TagDisplay({ tagName, color, isReadOnly, onClick }) {
    return (
        <span className={styles.tagCellContent} onClick={onClick}>
            <TagBadge name={tagName} color={color} />
            {!isReadOnly && <Pencil size={10} className={styles.tagEditIcon} />}
        </span>
    );
}

/** Table cell for viewing and editing event tags via dropdown. */
export function TagEditCell({ event, tags, theme, isReadOnly, isEditing, editValue, onEdit, onSave }) {
    const tagName = event.tag_name || event.tag?.name;
    const handleClick = (e) => { if (!isReadOnly && onEdit) onEdit(e); };

    if (isEditing && !isReadOnly) return <TagDropdown tags={tags} value={editValue} onSave={onSave} />;
    if (!tagName) return <EmptyTagDisplay isReadOnly={isReadOnly} onClick={handleClick} />;
    return <TagDisplay tagName={tagName} color={theme.color} isReadOnly={isReadOnly} onClick={handleClick} />;
}
