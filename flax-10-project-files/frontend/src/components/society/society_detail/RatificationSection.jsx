/**
 * RatificationSection manages the display and request flow for official society recognition.
 * RatificationToggle allows admins to opt-in during society creation.
 */

import styles from "./RatificationSection.module.css";
import PrimaryButton from "../../common/primary_button/PrimaryButton";

export function RatificationSection({ status, isRatified, onRequest, compact = false }) {
    if (isRatified) return <RatificationStatus label="Ratified" className={styles.statusApproved} compact={compact} />;
    if (status === 'pending') return <RatificationStatus label="Pending Approval" className={styles.statusPending} compact={compact} />;
    if (status === 'rejected') return <RatificationRejected onRequest={onRequest} compact={compact} />;
    return <RatificationRequest onRequest={onRequest} compact={compact} />;
}

function RatificationStatus({ label, className, compact }) {
    return (
        <div className={styles.section}>
            {!compact && <h4 className={styles.title}>Ratification Status</h4>}
            {compact && <h4 className={styles.compactTitle}>Request ratification to gain official society status.</h4>}
            <span className={className}>{label}</span>
        </div>
    );
}

function RatificationRejected({ onRequest, compact }) {
    return (
        <div className={styles.section}>
            {!compact && <h4 className={styles.title}>Ratification Status</h4>}
            {compact && <h4 className={styles.compactTitle}>Request ratification to gain official society status.</h4>}
            <span className={styles.statusRejected}>Rejected</span>
            <PrimaryButton className={styles.requestBtn} variant="secondary" pill onClick={onRequest}>Request Again</PrimaryButton>
        </div>
    );
}

function RatificationRequest({ onRequest, compact }) {
    return (
        <div className={styles.section}>
            {!compact && <h4 className={styles.title}>Ratification</h4>}
            {compact
                ? <h4 className={styles.compactTitle}>Request ratification to gain official society status.</h4>
                : <p className={styles.info}>Request ratification to gain official society status.</p>}
            <PrimaryButton className={styles.requestBtn} variant="secondary" pill onClick={onRequest}>Request Ratification</PrimaryButton>
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
                <p className={styles.toggleHint}>Ratified societies are officially recognised</p>
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
