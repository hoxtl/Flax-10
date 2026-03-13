import { Pencil } from 'lucide-react';
import AnimatedDropdown from '../../../common/AnimatedDropdown';
import styles from '../TableView.module.css';

function TagBadge({ name, color }) {
    const style = color ? { backgroundColor: color, color: '#fff' } : {};
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

export function TagEditCell({ event, tags, theme, isReadOnly, isEditing, editValue, onEdit, onSave, onCancel }) {
    const tagName = event.tag_name || event.tag?.name;
    const hasTag = !!tagName;

    if (isEditing && !isReadOnly) {
        return <TagDropdown tags={tags} value={editValue} onSave={onSave} />;
    }

    const handleClick = (e) => {
        if (!isReadOnly && onEdit) onEdit(e);
    };

    if (!hasTag) {
        return (
            <span className={styles.emptyTagCell} onClick={handleClick}>
                {!isReadOnly && <Pencil size={14} className={styles.editIcon} />}
            </span>
        );
    }

    return (
        <span className={styles.tagCellContent} onClick={handleClick}>
            <TagBadge name={tagName} color={theme.color} />
            {!isReadOnly && <Pencil size={10} className={styles.tagEditIcon} />}
        </span>
    );
}
