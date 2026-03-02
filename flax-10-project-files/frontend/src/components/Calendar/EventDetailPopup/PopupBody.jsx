import { MapPin, Calendar, Clock } from 'lucide-react';
import styles from "./EventDetailPopup.module.css";
import { formatDateWithYear, formatTimeRange } from "../utils/dateUtils";

export function PopupBody({ event }) {
    return (
        <div className={styles.body}>
            {event.location && <InfoLine icon={MapPin} value={event.location} />}
            <InfoLine icon={Calendar} value={formatDateWithYear(new Date(event.start_time))} />
            <InfoLine icon={Clock} value={formatTimeRange(event.start_time, event.end_time, event.all_day)} />
            {event.description && !event.title.includes(event.description) && <Description text={event.description} />}
        </div>
    );
}

function InfoLine({ icon: Icon, value }) {
    return <p className={styles.infoLine}><span className={styles.icon}><Icon size={14} /></span>{value}</p>;
}

function Description({ text }) {
    return (
        <div className={styles.descriptionBox}>
            <p className={styles.description}>{text}</p>
        </div>
    );
}
