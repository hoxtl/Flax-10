import StandardModal from "../../../components/common/StandardModal/StandardModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { formatTime } from "../utils/dateFormatUtils";

export function PlanReadDetailModal({
  item,
  styles,
  onClose,
  onEditTask,
  onDeleteTask,
  onEditEvent,
  onDeleteEvent,
}) {
  if (!item) return null;

  const isTask = !!item.task;
  const data = isTask ? item.task : item.event;
  if (!data) return null;

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
}
