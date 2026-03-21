/**
 * SyncButton allows users to synchronize society events with their personal calendar.
 * Utilizes the useSocietyCalendarSync hook for state management.
 */
import { useSocietyCalendarSync } from "../../../hooks/useSocietyCalendarSync";
import styles from "./SyncButton.module.css";

export default function SyncButton({ societyId, societyName }) {
    const { isSynced, loading, toggleSync } = useSocietyCalendarSync(societyId, societyName);
    const label = getButtonLabel(isSynced, loading);
    const className = getButtonClass(isSynced, loading);

    return (
        <button className={className} onClick={toggleSync} disabled={loading} title={getTooltip(isSynced)}>
            {label}
        </button>
    );
}

function getButtonLabel(isSynced, loading) {
    if (loading) return "...";
    return isSynced ? "✓ Synced" : "Sync to Calendar";
}

function getButtonClass(isSynced, loading) {
    if (loading) return `${styles.syncBtn} ${styles.loading}`;
    return isSynced ? `${styles.syncBtn} ${styles.synced}` : styles.syncBtn;
}

function getTooltip(isSynced) {
    return isSynced ? "Click to unsync from your calendar" : "Sync society events to your personal calendar";
}
