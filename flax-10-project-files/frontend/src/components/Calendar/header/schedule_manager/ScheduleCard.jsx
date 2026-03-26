/*
 * ScheduleCard.jsx
 * Schedule row with rename and remove actions.
 */

import PrimaryButton from "../../../common/primary_button/PrimaryButton";
import TextInput from "../../../common/text_input/TextInput";
import styles from "../CalendarHeaderUtils.module.css";

function ScheduleInfo({ isEditing, onRenameDraftChange, renameDraft, schedule }) {
  return (
    <div className={styles.scheduleInfo}>
      {isEditing ? (
        <TextInput
          value={renameDraft}
          onChange={({ target }) => onRenameDraftChange(target.value)}
          placeholder="Schedule name"
          aria-label={`Rename ${schedule.title}`}
        />
      ) : (
        <h3 className={styles.scheduleCardTitle}>{schedule.title}</h3>
      )}
      <p className={styles.scheduleMeta}>
        {schedule.event_allocations?.length || 0} allocated events
      </p>
    </div>
  );
}

function RenameActions({ isSaving, onRenameCancel, onRenameSave, scheduleId }) {
  return (
    <>
      <PrimaryButton
        type="button"
        variant="primary"
        pill
        disabled={isSaving}
        onClick={() => onRenameSave(scheduleId)}
      >
        Save
      </PrimaryButton>
      <PrimaryButton type="button" variant="ghost" pill onClick={onRenameCancel}>
        Cancel
      </PrimaryButton>
    </>
  );
}

function RemoveAction({ isRemoving, onRemoveRequest, scheduleId }) {
  return (
    <PrimaryButton
      type="button"
      variant="danger"
      pill
      disabled={isRemoving}
      onClick={() => onRemoveRequest(scheduleId)}
    >
      Remove
    </PrimaryButton>
  );
}

function SchedulePrimaryAction(props) {
  if (props.isEditing) return <RenameActions {...props} scheduleId={props.schedule.id} />;
  return (
    <PrimaryButton type="button" variant="ghost" pill onClick={() => props.onRenameStart(props.schedule)}>
      Rename
    </PrimaryButton>
  );
}

function ScheduleActions(props) {
  return (
    <div className={styles.scheduleActions}>
      <SchedulePrimaryAction {...props} />
      <RemoveAction
        isRemoving={props.isRemoving}
        onRemoveRequest={props.onRemoveRequest}
        scheduleId={props.schedule.id}
      />
    </div>
  );
}

export function ScheduleCard(props) {
  const isEditing = props.editingId === props.schedule.id;
  return (
    <article className={styles.scheduleCard}>
      <ScheduleInfo {...props} isEditing={isEditing} />
      <ScheduleActions {...props} isEditing={isEditing} />
    </article>
  );
}
