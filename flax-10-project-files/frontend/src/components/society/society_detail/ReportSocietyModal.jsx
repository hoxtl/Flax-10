/**
 * ReportSocietyModal provides a form for users to report societies for review.
 * Captures reasoning and submits to the backend.
 */

import { useState } from "react";
import StandardModal from "../../common/standard_modal/StandardModal";
import styles from "./ReportSocietyModal.module.css";
import { reportSociety } from "../../../api/societyApi";

/** Form for reporting a society with a specific reason. */

const FormContent = ({ reason, onTextChange, error, submitting }) => (
    <div className={styles.container}>
        <textarea className={styles.textarea} placeholder="Reason..." value={reason}
            onChange={onTextChange} rows={4} disabled={submitting} />
        {error && <p className={styles.error}>{error}</p>}
    </div>
);

const makeOnSubmit = (reason, setState, societyId, onReportSuccess, onClose) =>
    async () => {
        setState({ submitting: true, error: "" });
        try {
            await reportSociety(societyId, reason.trim());
        } catch {
            return setState({ submitting: false, error: "Failed to submit report." });
        }
        onReportSuccess?.();
        onClose();
    };

export default function ReportSocietyModal({ society, onClose, onReportSuccess }) {
    const [reason, setReason] = useState("");
    const [state, setState] = useState({ submitting: false, error: "" });
    const onSubmit = makeOnSubmit(reason, setState, society.id, onReportSuccess, onClose);

    return (
        <StandardModal title={`Report "${society.name}"`} onClose={onClose}
            subtitle="Please let us know why you are reporting this society.">
            <FormContent reason={reason} onTextChange={e => setReason(e.target.value)}
                error={state.error} submitting={state.submitting} />
            <ReportActions onClose={onClose} onSubmit={onSubmit}
                submitting={state.submitting} disabled={!reason.trim()} />
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
