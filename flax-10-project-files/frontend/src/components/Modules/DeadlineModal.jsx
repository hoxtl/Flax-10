import { useDeadlineModal } from './hooks/useDeadlineModal';
import DeadlineForm from './DeadlineForm';
import DeadlineCard from './DeadlineCard';
import styles from './DeadlineModal.module.css';

export default function DeadlineModal({ module, onClose }) {
    const modal = useDeadlineModal(module.id);
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <ModalHeader module={module} onClose={onClose} />
                {modal.showForm
                    ? <DeadlineForm initial={modal.editing} onSubmit={modal.handleSubmit} onCancel={modal.close} />
                    : <ModalBody modal={modal} />}
            </div>
        </div>
    );
}

function ModalHeader({ module, onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}> {module.module_code} — Deadlines</h3>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
    );
}

function ModalBody({ modal }) {
    return (
        <>
            <button className={styles.addBtn} onClick={modal.openCreate}>+ Add Deadline</button>
            <DeadlineList deadlines={modal.deadlines} onEdit={modal.openEdit} onDelete={modal.handleDelete} />
        </>
    );
}

function DeadlineList({ deadlines, onEdit, onDelete }) {
    if (!deadlines.length) return <p className={styles.empty}>No deadlines yet.</p>;
    return (
        <div className={styles.list}>
            {deadlines.map(d => (
                <DeadlineCard key={d.id} deadline={d} is_teacher={true} onEdit={() => onEdit(d)} onDelete={() => onDelete(d.id)} />
            ))}
        </div>
    );
}