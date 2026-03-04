import styles from "./EventDetailPopup.module.css";

export function PopupHeader({ event, tag, onClose }) {
    const isNoneTag = tag?.id === 'none';
    return (
        <div className={styles.header}>
            <div className={styles.titleRow}>
                <h3 className={styles.title}>{event.title}</h3>
                {tag && !isNoneTag && <TagBadge tag={tag} />}
                <SourceBadge event={event} />
            </div>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
}

function TagBadge({ tag }) {
    const color = tag.color || '#9E7E5D';
    return <span className={styles.tagBadge} style={{ backgroundColor: color }}>{tag.label || tag.name}</span>;
}

function SourceBadge({ event }) {
    if (event.source === 'society' && event.society_name) {
        return <span className={styles.societyBadge}>{event.society_name}</span>;
    }
    if (isModuleEvent(event) && event.module_name) {
        return <span className={styles.moduleBadge}>{event.module_name}</span>;
    }
    return null;
}

function isModuleEvent(event) {
    return event.source === 'module_enrollment' || event.source === 'module_deadline';
}
