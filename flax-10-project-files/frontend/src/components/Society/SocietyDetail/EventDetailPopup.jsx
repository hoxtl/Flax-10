import { useEffect, useRef } from "react";
import styles from "./EventDetailPopup.module.css";
import { formatDateWithYear, formatTimeRange } from "../../../utils/dateUtils";

export default function EventDetailPopup({ event, tags, anchorRect, onClose, onViewAnnouncement }) {
    const popupRef = useRef(null);
    const tag = tags?.find(t => t.id === event?.tag);
    const position = usePopupPosition(popupRef, anchorRect);

    useEffect(() => {
        const handleClickOutside = (e) => { if (popupRef.current && !popupRef.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (!event) return null;

    return (
        <div ref={popupRef} className={styles.popup} style={position}>
            <PopupHeader event={event} tag={tag} onClose={onClose} />
            <PopupBody event={event} tag={tag} />
            {event.announcementId && <PopupFooter onViewAnnouncement={onViewAnnouncement} />}
        </div>
    );
}

function usePopupPosition(ref, anchorRect) {
    if (!anchorRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" };
    const top = anchorRect.bottom + 8;
    const left = Math.max(8, anchorRect.left);
    return { top: `${top}px`, left: `${left}px`, position: "fixed" };
}

function PopupHeader({ event, tag, onClose }) {
    return (
        <div className={styles.header}>
            <div className={styles.titleRow}>
                <h3 className={styles.title}>{event.title}</h3>
                {tag && <TagBadge tag={tag} />}
            </div>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
}

function TagBadge({ tag }) {
    return <span className={styles.tagBadge} style={{ backgroundColor: tag.color }}>{tag.label}</span>;
}

function PopupBody({ event, tag }) {
    return (
        <div className={styles.body}>
            {event.location && <InfoLine icon="📍" value={event.location} />}
            <InfoLine icon="📅" value={formatDateWithYear(new Date(event.start_time))} />
            <InfoLine icon="🕐" value={formatTimeRange(event.start_time, event.end_time, event.all_day)} />
            {tag && <InfoLine icon="🏷️" value={`Type: ${tag.label}`} />}
            {event.description && <Description text={event.description} />}
        </div>
    );
}

function InfoLine({ icon, value }) {
    return <p className={styles.infoLine}><span className={styles.icon}>{icon}</span>{value}</p>;
}

function Description({ text }) {
    return <p className={styles.description}>{text}</p>;
}

function PopupFooter({ onViewAnnouncement }) {
    return (
        <div className={styles.footer}>
            <button className={styles.viewBtn} onClick={onViewAnnouncement}>View Announcement</button>
        </div>
    );
}

