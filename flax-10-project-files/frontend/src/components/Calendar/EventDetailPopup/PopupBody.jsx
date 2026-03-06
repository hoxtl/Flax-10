import styles from "./EventDetailPopup.module.css";
import { formatDateRange, formatTimeRange } from "../utils/dateUtils";

export function PopupBody({ event }) {
    return (
        <div className={styles.body}>
            {event.location && <InfoLine icon="📍" value={event.location} />}
            <InfoLine icon="📅" value={formatDateRange(event.start_time, event.end_time, event.all_day)} />
            <InfoLine icon="🕐" value={formatTimeRange(event.start_time, event.end_time, event.all_day)} />
            {event.description && <Description text={event.description} />}
        </div>
    );
}

function InfoLine({ icon, value }) {
    return <p className={styles.infoLine}><span className={styles.icon}>{icon}</span>{value}</p>;
}

function Description({ text }) {
    return (
        <div className={styles.descriptionBox}>
            <p className={styles.description}>{text}</p>
        </div>
    );
}
