import PrimaryButton from '../../../Common/PrimaryButton/PrimaryButton';
import TextInput from '../../../Common/TextInput/TextInput';
import styles from '../CalendarHeaderUtils.module.css';
function ScheduleInfo({ isEditing, renameDraft, onRenameDraftChange, schedule }) {
    return (
        <div className={styles.scheduleInfo}>
            {isEditing ? <TextInput value={renameDraft} onChange={(e) => onRenameDraftChange(e.target.value)} placeholder="Schedule name" /> : <h3 className={styles.scheduleCardTitle}>{schedule.title}</h3>}
            <p className={styles.scheduleMeta}>{schedule.event_allocations?.length || 0} allocated events</p>
        </div>
    );
}
function ScheduleActions({ isEditing, isSaving, onRenameSave, onRenameCancel, onRenameStart, onRemoveRequest, schedule, isRemoving }) {
    return (
        <div className={styles.scheduleActions}>
            {isEditing ? (
                <>
                    <PrimaryButton variant="primary" pill disabled={isSaving} onClick={() => onRenameSave(schedule.id)}>Save</PrimaryButton>
                    <PrimaryButton variant="ghost" pill onClick={onRenameCancel}>Cancel</PrimaryButton>
                </>
            ) : <PrimaryButton variant="ghost" pill onClick={() => onRenameStart(schedule)}>Rename</PrimaryButton>}
            <PrimaryButton variant="danger" pill disabled={isRemoving} onClick={() => onRemoveRequest(schedule.id)}>Remove</PrimaryButton>
        </div>
    );
}
export function ScheduleCard(props) {
    const isEditing = props.editingId === props.schedule.id;
    return (
        <article className={styles.scheduleCard}>
            <ScheduleInfo isEditing={isEditing} renameDraft={props.renameDraft} onRenameDraftChange={props.onRenameDraftChange} schedule={props.schedule} />
            <ScheduleActions {...props} isEditing={isEditing} />
        </article>
    );
}
