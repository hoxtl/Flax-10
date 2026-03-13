/**
 * ReportSocietyModal provides a form for users to report societies for review.
 * Captures reasoning and submits to the backend.
 */
import { useState } from "react";
import StandardModal from "../../common/StandardModal/StandardModal";
import styles from "./ReportSocietyModal.module.css";
import { reportSociety } from "../../../api/societyApi";

/** Form for reporting a society with a specific reason. */
export default function ReportSocietyModal({ society, onClose, onReportSuccess }) {
    const [reason, setReason] = useState("");
    const [state, setState] = useState({ submitting: false, error: "" });

    const handleSubmit = async () => {
        if (!reason.trim()) return setState(s => ({ ...s, error: "Please provide a reason." }));
        setState({ submitting: true, error: "" });
        try {
            await reportSociety(society.id, reason.trim());
            onReportSuccess?.();
            onClose();
        } catch (err) {
            setState({ submitting: false, error: "Failed to submit report." });
        }
    };

    return (
        <StandardModal title={`Report "${society.name}"`}
            subtitle="Please let us know why you are reporting this society." onClose={onClose}>
            <div className={styles.container}>
                <textarea className={styles.textarea} placeholder="Reason..." value={reason}
                    onChange={(e) => { setReason(e.target.value); setState(s => ({ ...s, error: "" })); }}
                    rows={4} disabled={state.submitting} />
                {state.error && <p className={styles.error}>{state.error}</p>}
                <ReportActions onClose={onClose} onSubmit={handleSubmit}
                    submitting={state.submitting} disabled={!reason.trim()} />
            </div>
        </StandardModal>
    );
}

function ReportActions({ onClose, onSubmit, submitting, disabled }) {
    return (
        <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose} disabled={submitting}>Cancel</button>
            <button className={styles.submitButton} onClick={onSubmit} disabled={submitting || disabled}>
                {submitting ? "Submitting..." : "Submit Report"}
            </button>
        </div>
    );
}
