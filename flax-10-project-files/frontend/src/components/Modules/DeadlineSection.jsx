import {useState} from 'react';
import DeadlineCard from './DeadlineCard';
import DeadlineForm from './DeadlineForm';
import { createDeadline, updateDeadline, deleteDeadline } from '../../api/deadline_api';
import styles from './DeadlineSection.module.css';

function useDeadlineForm() {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const openCreate = () => {setEditing(null); setShowForm(true);};
    const openEdit = (deadline) => {setEditing(deadline); setShowForm(true); };
    const close = () => {setEditing(null); setShowForm(false);};
    return {showForm, editing, openCreate, openEdit, close};
}

function DeadlineList({deadlines, is_teacher, onEdit, onDelete}) {
    if (!deadlines.length) return <p className={styles.empty}> No deadlines added yet!</p>;
    return (
        <div className={styles.list}>
            {deadlines.map(d => (
                <DeadlineCard
                    key={d.id}
                    deadline={d}
                    is_teacher={is_teacher}
                    onEdit={() => onEdit(d)}
                    onDelete={() => onDelete(d.id)} />
            ))}
        </div>
    )
}

export default function DeadlineSection({module_id, deadlines, setDeadlines, is_teacher}) {
    const {showForm, editing, openCreate, openEdit, close} = useDeadlineForm();
    const handleSubmit = async (data) => {
        if(editing) {
            const updated = await updateDeadline(module_id, editing.id, data);
            setDeadlines(prev => prev.map(d => d.id === editing.id ? updated : d));
        }
        else {
            const created = await createDeadline(module_id, data);
            setDeadlines(prev => [...prev, created]);
        }
        close();
    };
    
    const handleDelete = async(id) => {
        await deleteDeadline(module_id, id);
        setDeadlines(prev => prev.filter(d => d.id !== id));
    };

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Deadlines</h3>
                {is_teacher ? <button className={styles.addBtn} onClick={openCreate}>+ Add Deadline</button> : null}
            </div>
            {showForm
                ? <DeadlineForm initial={editing} onSubmit={handleSubmit} onCancel={close} />
                : <DeadlineList deadlines={deadlines} is_teacher={is_teacher} onEdit={openEdit} onDelete={handleDelete} />
            }
        </section>
    );
}
