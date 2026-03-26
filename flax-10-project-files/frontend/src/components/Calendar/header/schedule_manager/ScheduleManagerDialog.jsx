/*
 * ScheduleManagerDialog.jsx
 * Modal for renaming and deleting saved schedules.
 */

import { useToast } from "../../../../context/ToastContext";
import HoldConfirmModal from "../../../common/hold_confirm_modal/HoldConfirmModal";
import PrimaryButton from "../../../common/primary_button/PrimaryButton";
import StandardModal from "../../../common/standard_modal/StandardModal";
import { ScheduleCard } from "./ScheduleCard";
import styles from "../CalendarHeaderUtils.module.css";
import { buildScheduleManagerHandlers, useScheduleManagerState } from "./useScheduleManagerState";

function openQuickAddSchedule(onClose) {
  window.dispatchEvent(
    new CustomEvent("quick-add:open", { detail: { view: "schedule_auto" } }),
  );
  onClose?.();
}

function ScheduleEmptyState({ onClose }) {
  return (
    <div className={styles.scheduleEmptyActions}>
      <PrimaryButton
        variant="ghost"
        size="small"
        pill
        onClick={() => openQuickAddSchedule(onClose)}
      >
        ⚙️ Auto Schedule
      </PrimaryButton>
    </div>
  );
}

function ScheduleList(props) {
  return (
    <div className={styles.scheduleList}>
      {props.schedules.map((schedule) => (
        <ScheduleListItem key={schedule.id} {...props} schedule={schedule} />
      ))}
    </div>
  );
}

function ScheduleListItem(props) {
  const { editingId, isDeleting, isSaving, schedule } = props;
  return (
    <ScheduleCard
      schedule={schedule}
      editingId={editingId}
      renameDraft={props.renameDraft}
      isSaving={isSaving && editingId === schedule.id}
      isRemoving={isDeleting && props.removeId === schedule.id}
      onRenameStart={props.onRenameStart}
      onRenameCancel={props.onRenameCancel}
      onRenameDraftChange={props.onRenameDraftChange}
      onRenameSave={props.onRenameSave}
      onRemoveRequest={props.onRemoveRequest}
    />
  );
}

function ScheduleDialogBody(props) {
  if (props.loading) return <p className={styles.scheduleDialogEmpty}>Loading schedules…</p>;
  if (props.schedules.length === 0) return <ScheduleEmptyState onClose={props.onClose} />;
  return <ScheduleList {...props} />;
}

function DeleteConfirm({ onCancel, onConfirm, removeId }) {
  if (!removeId) return null;
  return (
    <HoldConfirmModal
      title="Remove Schedule"
      warningText="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function ScheduleManagerContent({ handlers, onClose, state }) {
  return (
    <StandardModal title="Schedules" subtitle="Manage your saved schedules." onClose={onClose}>
      <div className={styles.scheduleDialogBody}>
        <ScheduleDialogBody {...state} {...handlers} onClose={onClose} />
      </div>
      <DeleteConfirm removeId={state.removeId} onCancel={() => state.setRemoveId(null)} onConfirm={handlers.onDelete} />
    </StandardModal>
  );
}

export function ScheduleManagerDialog({ open, onClose }) {
  const showToast = useToast();
  const state = useScheduleManagerState(open, showToast);
  const handlers = buildScheduleManagerHandlers(state, showToast);
  if (!open) return null;
  return <ScheduleManagerContent handlers={handlers} onClose={onClose} state={state} />;
}
