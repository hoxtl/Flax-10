import { useReadingModal } from "./hooks/useReadingModal";
import ReadingForm from "./ReadingForm";
import ReadingCard from "./ReadingCard";
import styles from './DeadlineModal.module.css';

export default function ReadingModal({ module, onClose}) {
    const modal = useReadingModal(module.id);
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <ModalHeader module={module} onClose={onClose} />
                {modal.showForm
                    ? <ReadingForm initial={modal.editing} onSubmit={modal.handleSubmit} onCancel={modal.close} />
                    : <ModalBody modal={modal} />}
            </div>
        </div>
    );
}

function ModalHeader({ module, onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}> {module.module_code} — Readings</h3>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
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