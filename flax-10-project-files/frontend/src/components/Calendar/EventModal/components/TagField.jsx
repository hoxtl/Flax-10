import { useTags } from '../../../../context/TagContext';
import styles from './TagField.module.css';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const uniqueTags = Array.from(
        new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values()
    );

    return (
        <div className="form-field">
            <label>Type</label>
            <div className={styles.grid}>
                {uniqueTags.map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        className={`${styles.pill} ${String(value) === String(tag.id) ? styles.active : ''}`}
                        style={String(value) === String(tag.id) ? { borderColor: tag.color, backgroundColor: `${tag.color}18` } : {}}
                        onClick={() => onChange({ target: { value: tag.id } })}
                    >
                        <span className={styles.dot} style={{ backgroundColor: tag.color }} />
                        {tag.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
