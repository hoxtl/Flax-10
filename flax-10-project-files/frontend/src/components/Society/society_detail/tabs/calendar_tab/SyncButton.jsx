/**
 * SyncButton allows users to synchronize society events with their personal calendar.
 * Utilizes the useSocietyCalendarSync hook for state management.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/tabs/calendar_tab/SyncButton.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/tabs/calendarTab/SyncButton.jsx
import { useSocietyCalendarSync } from "../../../hooks/useSocietyCalendarSync";
import PrimaryButton from "../../../../common/primary_button/PrimaryButton";
import styles from "./SyncButton.module.css";

export default function SyncButton({ societyId, societyName }) {
    const { isSynced, loading, toggleSync } = useSocietyCalendarSync(societyId, societyName);
    const label = getButtonLabel(isSynced, loading);
    const className = getButtonClass(isSynced);

    return (
        <PrimaryButton
            className={className}
            variant={isSynced ? "secondary" : "ghost"}
            size="small"
            pill
            onClick={toggleSync}
            disabled={loading}
            title={getTooltip(isSynced)}
            aria-pressed={isSynced}
        >
            {label}
        </PrimaryButton>
    );
}

function getButtonLabel(isSynced, loading) {
    if (loading) return "...";
    return isSynced ? "✓ Synced" : "Sync to Calendar";
}

function getButtonClass(isSynced) {
    return isSynced ? `${styles.syncBtn} ${styles.synced}` : styles.syncBtn;
}

function getTooltip(isSynced) {
    return isSynced ? "Click to unsync from your calendar" : "Sync society events to your personal calendar";
}
