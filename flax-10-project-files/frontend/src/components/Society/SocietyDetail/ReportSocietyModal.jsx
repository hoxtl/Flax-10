import { useState } from "react";
import StandardModal from "../../common/StandardModal/StandardModal";
import styles from "./ReportSocietyModal.module.css";
import { reportSociety } from "../../../api/societyApi";

export default function ReportSocietyModal({ society, onClose, onReportSuccess }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason to report this society.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await reportSociety(society.id, reason.trim());
            onReportSuccess?.();
            onClose();
        } catch (err) {
            setError("Failed to submit the report. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StandardModal
            title={`Report "${society.name}"`}
            subtitle="Please let us know why you are reporting this society."
            onClose={onClose}
        >
            <div className={styles.container}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} data-testid="report-form">
                <textarea
                    className={styles.textarea}
                    placeholder="Enter the reason for reporting..."
                    value={reason}
                    onChange={(e) => { setReason(e.target.value); setError(""); }}
                    rows={4}
                    disabled={submitting}
                />
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.actions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={submitting || !reason.trim()}
                    >
                        {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
                </form>
            </div>
        </StandardModal>
    );
}
