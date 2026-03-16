import { useDeadlineModal } from './hooks/useDeadlineModal';
import DeadlineForm from './DeadlineForm';
import DeadlineCard from './DeadlineCard';
import StandardModal from '../common/StandardModal/StandardModal';
import styles from './DeadlineModal.module.css';

export default function DeadlineModal({ module, onClose, startCreating }) {
    const modal = useDeadlineModal(module.id, startCreating);
    const handleCancel = () => { if (startCreating && !modal.editing) onClose(); else modal.close(); };
    const handleSubmitWrap = async (d) => { await modal.handleSubmit(d); if (startCreating && !modal.editing) onClose(); };
    return (
        <StandardModal
            title={`${module.module_code} - Deadlines`}
            onClose={onClose}
            size="md"
            modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}
        >
                {modal.showForm
                    ? <DeadlineForm initial={modal.editing} onSubmit={handleSubmitWrap} onCancel={handleCancel} />
                    : <ModalBody modal={modal} />}
        </StandardModal>
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
