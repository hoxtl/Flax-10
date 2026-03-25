/*
 * Modal for managing module readings.
 */

import { useReadingModal } from "../hooks/useReadingModal";
import ReadingForm from "./ReadingForm";
import ReadingCard from "./ReadingCard";
import styles from '../Deadlines/DeadlineModal.module.css';
import StandardModal from "../../common/StandardModal/StandardModal";

export default function ReadingModal({ module, onClose}) {
    const modal = useReadingModal(module.id);
    return (
        <StandardModal
            title={`${module.module_code} - Readings`}
            onClose={onClose}
            size="md"
            modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}
        >
                {modal.showForm
                    ? <ReadingForm initial={modal.editing} onSubmit={modal.handleSubmit} onCancel={modal.close} />
                    : <ModalBody modal={modal} />}
        </StandardModal>
    );
}

function ModalBody({ modal }) {
    return (
        <>
            <button className={styles.addBtn} onClick={modal.openCreate}>+ Add Reading</button>
            <ReadingList readings={modal.readings} onEdit={modal.openEdit} onDelete={modal.handleDelete} />
        </>
    );
}

function ReadingList({  readings, onEdit, onDelete }) {
    if (!readings.length) return <p className={styles.empty}>No readings yet.</p>;
    return (
        <div className={styles.list}>
            {readings.map(r => (
                <ReadingCard key={r.id} reading={r} isTeacher={true} onEdit={() => onEdit(r)} onDelete={() => onDelete(r.id)} />
            ))}
        </div>
    );
}
