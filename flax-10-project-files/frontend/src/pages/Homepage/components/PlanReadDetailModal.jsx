/**
 * Plan timeline read modal — task or event detail overlay.
 */

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
    <div
      className={styles.actionHubReadOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-read-title"
      onClick={onClose}
    >
      <div className={styles.actionHubReadModal} onClick={(e) => e.stopPropagation()}>
        <h2 id="plan-read-title" className={styles.actionHubReadTitle}>
          {title}
        </h2>
        <p className={styles.actionHubReadTime}>{timeStr}</p>
        {data?.description && (
          <p className={styles.actionHubReadDescription}>{data.description}</p>
        )}
        <div className={styles.actionHubReadFooter}>
          <PrimaryButton type="button" className={styles.actionHubReadBtn} variant="ghost" pill onClick={handleEdit}>Edit</PrimaryButton>
          <PrimaryButton type="button" className={styles.actionHubReadBtnDanger} variant="danger" pill onClick={handleDelete}>Delete</PrimaryButton>
        </div>
        <PrimaryButton type="button" className={styles.actionHubReadClose} variant="ghost" size="small" pill onClick={onClose} aria-label="Close">×</PrimaryButton>
      </div>
    </div>
  );
}
