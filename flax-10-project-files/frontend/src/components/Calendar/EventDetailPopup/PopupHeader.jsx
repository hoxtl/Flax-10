import styles from "./EventDetailPopup.module.css";

export function PopupHeader({ event, tag, onClose }) {
    return (
        <div className={styles.header}>
            <div className={styles.titleRow}>
                <h3 className={styles.title}>{event.title}</h3>
                {tag && <TagBadge tag={tag} />}
                {event.source === 'society' && <SocietyBadge name={event.society_name} />}
            </div>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
}

function TagBadge({ tag }) {
    const color = tag.color || '#9E7E5D';
    return <span className={styles.tagBadge} style={{ backgroundColor: color }}>{tag.label || tag.name}</span>;
}

function SocietyBadge({ name }) {
    return <span className={styles.societyBadge}>{name}</span>;
}
