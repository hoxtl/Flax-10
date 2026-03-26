<<<<<<< HEAD
/**
 * Plan read detail modal.
 */

import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import StandardModal from "../../../components/common/standard_modal/StandardModal";
=======
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { formatTime } from "../utils/dateFormatUtils";

export function PlanReadDetailModal(props) {
  const data = getModalData(props.item);
  if (!data) return null;
  return <StandardModal title={data.title} subtitle={data.timeStr} onClose={props.onClose} size="sm"><ModalBody data={data} styles={props.styles} onClose={props.onClose} onDeleteEvent={props.onDeleteEvent} onDeleteTask={props.onDeleteTask} onEditEvent={props.onEditEvent} onEditTask={props.onEditTask} /></StandardModal>;
}

function getModalData(item) {
  if (!item) return null;
  const isTask = Boolean(item.task);
  const data = isTask ? item.task : item.event;
  if (!data) return null;
<<<<<<< HEAD
  return { data, isTask, timeStr: getTimeLabel(isTask, data), title: data.title || "" };
}

function getTimeLabel(isTask, data) {
  return isTask ? getTaskTimeLabel(data) : getEventTimeLabel(data);
}

function getTaskTimeLabel(data) {
  return `${data.due_date ? formatTime(data.due_date) : ""}${data.estimated_blocks ? ` · ${(data.estimated_blocks || 1) * 25}m` : ""}`;
}

function getEventTimeLabel(data) {
  const start = data.start_time ? formatTime(data.start_time) : "";
  const end = data.end_time && data.end_time !== data.start_time ? ` – ${formatTime(data.end_time)}` : "";
  const duration = data.start_time && data.end_time ? ` · ${Math.round((new Date(data.end_time) - new Date(data.start_time)) / 60000)}m` : "";
  return `${start}${end}${duration}`;
}

function ModalBody(props) {
  return <div className={props.styles.actionHubReadContent}>{props.data.data.description && <p className={props.styles.actionHubReadDescription}>{props.data.data.description}</p>}<div className={props.styles.actionHubReadFooter}><ActionButton className={props.styles.actionHubReadBtn} label="Edit" onClick={() => handleEdit(props)} variant="ghost" /><ActionButton className={props.styles.actionHubReadBtnDanger} label="Delete" onClick={() => handleDelete(props)} variant="danger" /></div></div>;
}

function ActionButton({ className, label, onClick, variant }) {
  return <PrimaryButton type="button" className={className} variant={variant} pill onClick={onClick}>{label}</PrimaryButton>;
}

function handleEdit(props) {
  if (props.data.isTask) props.onEditTask?.(props.data.data);
  else props.onEditEvent?.(props.data.data);
  props.onClose();
}

async function handleDelete(props) {
  try {
    await deletePlanItem(props);
    props.onClose();
  } catch {}
}

async function deletePlanItem(props) {
  if (props.data.isTask) await props.onDeleteTask?.(props.data.data);
  else await props.onDeleteEvent?.(props.data.data);
=======

  const handleEdit = () => {
    if (isTask) onEditTask?.(data);
    else onEditEvent?.(data);
    onClose();
  };

  const handleDelete = async () => {
    try {
      if (isTask) await onDeleteTask?.(data);
      else await onDeleteEvent?.(data);
      onClose();
    } catch (_) {}
  };

  const title = data?.title ?? "";
  const timeStr = isTask
    ? (data.due_date ? formatTime(data.due_date) : "") +
      (data.estimated_blocks ? ` · ${(data.estimated_blocks || 1) * 25}m` : "")
    : (data.start_time ? formatTime(data.start_time) : "") +
      (data.end_time && data.end_time !== data.start_time ? ` – ${formatTime(data.end_time)}` : "") +
      (data.start_time && data.end_time ? ` · ${Math.round((new Date(data.end_time) - new Date(data.start_time)) / 60000)}m` : "");

  return (
    <StandardModal
      title={title}
      subtitle={timeStr}
      onClose={onClose}
      size="sm"
    >
      <div className={styles.actionHubReadContent}>
        {data?.description && (
          <p className={styles.actionHubReadDescription}>{data.description}</p>
        )}
        <div className={styles.actionHubReadFooter}>
          <PrimaryButton type="button" className={styles.actionHubReadBtn} variant="ghost" pill onClick={handleEdit}>Edit</PrimaryButton>
          <PrimaryButton type="button" className={styles.actionHubReadBtnDanger} variant="danger" pill onClick={handleDelete}>Delete</PrimaryButton>
        </div>
      </div>
    </StandardModal>
  );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
