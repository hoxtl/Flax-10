import { useState, useEffect } from 'react';
import { getSchedules, renameSchedule, deleteSchedule } from '../../../../api/scheduleApi';
import { useToast } from '../../../../context/ToastContext';
import StandardModal from '../../../common/StandardModal/StandardModal';
import HoldConfirmModal from '../../../common/HoldConfirmModal/HoldConfirmModal';
import PrimaryButton from '../../../common/PrimaryButton/PrimaryButton';
import { ScheduleCard } from './ScheduleCard';
import styles from '../CalendarHeaderUtils.module.css';
function useSchedules(open) {
    const showToast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => { if (open) load(); }, [open]);
    const load = async () => {
        setLoading(true);
        try {
            const data = await getSchedules();
            setSchedules(Array.isArray(data) ? data : []);
        } catch (e) { showToast(e.message, { variant: 'error' }); }
        finally { setLoading(false); }
    };
    return { schedules, setSchedules, loading };
}
function ScheduleEmpty({ onClose }) {
    const openQuickAdd = () => {
        window.dispatchEvent(new CustomEvent('quick-add:open', { detail: { view: 'schedule_auto' } }));
        onClose?.();
    };
    return (
        <div className={styles.scheduleEmptyActions}>
            <PrimaryButton variant="primary" pill onClick={openQuickAdd}>⚙️ Auto Schedule</PrimaryButton>
        </div>
    );
}
function ScheduleList({ schedules, editingId, renameDraft, isSaving, handlers }) {
    return (
        <div className={styles.scheduleList}>
            {schedules.map(s => <ScheduleCard key={s.id} schedule={s} editingId={editingId} renameDraft={renameDraft}
                isSaving={isSaving && editingId === s.id} onRenameStart={handlers.onRenameStart} onRenameCancel={handlers.onRenameCancel}
                onRenameDraftChange={handlers.onRenameDraftChange} onRenameSave={handlers.onRenameSave} onRemoveRequest={handlers.onRemoveRequest} />)}
        </div>
    );
}
function ModalsContainer({ removeId, confirmDelete, setRemoveId }) {
    if (!removeId) return null;
    return (
        <HoldConfirmModal title="Remove Schedule" warningText="This cannot be undone."
            onConfirm={confirmDelete} onCancel={() => setRemoveId(null)} />
    );
}
function ScheduleDialogBody({ loading, schedules, editingId, renameDraft, isSaving, handlers, onClose }) {
    if (loading) return <p className={styles.scheduleDialogEmpty}>Loading schedules…</p>;
    return (
        <div className={styles.scheduleDialogBody}>
            {schedules.length === 0 && <ScheduleEmpty onClose={onClose} />}
            <ScheduleList schedules={schedules} editingId={editingId} renameDraft={renameDraft} isSaving={isSaving} handlers={handlers} />
        </div>
    );
}
function useRenameAction(setSchedules, renameDraft, setEditingId) {
    const showToast = useToast(); const [isSaving, setIsSaving] = useState(false);
    const saveRename = async (id) => {
        const next = renameDraft.trim(); if (!next) return showToast('Enter a name.', { variant: 'error' });
        setIsSaving(true);
        try {
            const data = await renameSchedule(id, next);
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, title: next, event_allocations: data.event_allocations ?? s.event_allocations } : s));
            setEditingId(null);
        } catch (e) { showToast(e.message, { variant: 'error' }); } finally { setIsSaving(false); }
    };
    return { isSaving, saveRename };
}
function useDeleteAction(setSchedules, removeId, setRemoveId) {
    const showToast = useToast();
    const confirmDelete = async () => {
        try {
            await deleteSchedule(removeId);
            setSchedules(prev => prev.filter(s => s.id !== removeId));
            setRemoveId(null); showToast("Schedule deleted.");
        } catch (e) { showToast(e.message, { variant: 'error' }); }
    };
    return { confirmDelete };
}
function useScheduleOperations(setSchedules) {
    const [editingId, setEditingId] = useState(null), [renameDraft, setRenameDraft] = useState('');
    const [removeId, setRemoveId] = useState(null);
    const { isSaving, saveRename } = useRenameAction(setSchedules, renameDraft, setEditingId);
    const { confirmDelete } = useDeleteAction(setSchedules, removeId, setRemoveId);
    return { editingId, setEditingId, renameDraft, setRenameDraft, removeId, setRemoveId, isSaving, saveRename, confirmDelete };
}
export function ScheduleManagerDialog({ open, onClose }) {
    const { schedules, setSchedules, loading } = useSchedules(open);
    const ops = useScheduleOperations(setSchedules);
    if (!open) return null;
    const h = {
        onRenameStart: (s) => { ops.setEditingId(s.id); ops.setRenameDraft(s.title); },
        onRenameCancel: () => ops.setEditingId(null), onRenameDraftChange: ops.setRenameDraft,
        onRenameSave: ops.saveRename, onRemoveRequest: ops.setRemoveId
    };
    return (
        <StandardModal title="Schedules" subtitle="Manage your saved schedules." onClose={onClose}>
            <ScheduleDialogBody loading={loading} schedules={schedules} editingId={ops.editingId}
                renameDraft={ops.renameDraft} isSaving={ops.isSaving} handlers={h} onClose={onClose} />
            <ModalsContainer removeId={ops.removeId} confirmDelete={ops.confirmDelete} setRemoveId={ops.setRemoveId} />
        </StandardModal>
    );
}
