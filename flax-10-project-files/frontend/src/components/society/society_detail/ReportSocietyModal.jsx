/**
 * ReportSocietyModal provides a form for users to report societies for review.
 * Captures reasoning and submits to the backend.
 */

import { useState } from "react";
import StandardModal from "../../common/standard_modal/StandardModal";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
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

const makeOnSubmit = (reason, setState, societyId, onReportSuccess) =>
    async () => {
        setState({ submitting: true, error: "" });
        try {
            await reportSociety(societyId, reason.trim());
        } catch {
            return setState({ submitting: false, error: "Failed to submit report." });
        }
        onReportSuccess?.();
        setState({ submitting: false, error: "", submitted: true });
    };

export default function ReportSocietyModal({ society, onClose, onReportSuccess }) {
    const [reason, setReason] = useState("");
    const [state, setState] = useState({ submitting: false, error: "", submitted: false });
    const onSubmit = makeOnSubmit(reason, setState, society.id, onReportSuccess);

    if (state.submitted) {
        return (
            <StandardModal
                title="Report submitted"
                subtitle={`Thanks for flagging ${society.name}. Our team will review it shortly.`}
                onClose={onClose}
                size="sm"
                centerText
            >
                <div className={styles.successBody}>
                    <div className={styles.successBadge} aria-hidden="true">✓</div>
                    <p className={styles.successText}>You can still unreport this society later if you submitted this by mistake.</p>
                    <div className={styles.actions}>
                        <PrimaryButton className={styles.confirmButton} onClick={onClose} pill>
                            Done
                        </PrimaryButton>
                    </div>
                </div>
            </StandardModal>
        );
    }

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
            <PrimaryButton className={styles.cancelButton} variant="ghost" onClick={onClose} disabled={submitting} pill>Cancel</PrimaryButton>
            <PrimaryButton className={styles.submitButton} variant="danger" onClick={onSubmit} disabled={submitting || disabled} pill>
                {submitting ? "Submitting..." : "Submit Report"}
            </PrimaryButton>
        </div>
    );
}
