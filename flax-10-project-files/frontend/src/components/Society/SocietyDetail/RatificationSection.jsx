/**
 * RatificationSection manages the display and request flow for official society recognition.
 * RatificationToggle allows admins to opt-in during society creation.
 */
import styles from "./RatificationSection.module.css";

export function RatificationSection({ status, isRatified, onRequest }) {
    if (isRatified) return <RatificationStatus label="Ratified" className={styles.statusApproved} />;
    if (status === 'pending') return <RatificationStatus label="Pending Approval" className={styles.statusPending} />;
    if (status === 'rejected') return <RatificationRejected onRequest={onRequest} />;
    return <RatificationRequest onRequest={onRequest} />;
}

function RatificationStatus({ label, className }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.title}>Ratification Status</h4>
            <span className={className}>{label}</span>
        </div>
    );
}

function RatificationRejected({ onRequest }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.title}>Ratification Status</h4>
            <span className={styles.statusRejected}>Rejected</span>
            <button className={styles.requestBtn} onClick={onRequest}>Request Again</button>
        </div>
    );
}

function RatificationRequest({ onRequest }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.title}>Ratification</h4>
            <p className={styles.info}>Request ratification to gain official society status.</p>
            <button className={styles.requestBtn} onClick={onRequest}>Request Ratification</button>
        </div>
    );
}

/** Toggle for requesting ratification during society setup. */
export function RatificationToggle({ requested, onToggle }) {
    return (
        <div className={styles.toggleSection}>
            <ToggleHeader requested={requested} onToggle={onToggle} />
            {requested && <RatificationNotice />}
        </div>
    );
}

function ToggleHeader({ requested, onToggle }) {
    return (
        <div className={styles.toggleRow}>
            <div>
                <label className={styles.toggleLabel}>Request Ratification</label>
                <p className={styles.toggleHint}>Ratified societies are officially recognized</p>
            </div>
            <button className={`${styles.toggle} ${requested ? styles.toggleOn : ""}`}
                onClick={() => onToggle(!requested)} type="button">
                <span className={styles.toggleKnob} />
            </button>
        </div>
    );
}

function RatificationNotice() {
    return (
        <div className={styles.notice}>
            <span className={styles.noticeIcon}>i</span>
            <span>Ratification requires admin approval. Your society will show as pending until approved.</span>
        </div>
    );
}
