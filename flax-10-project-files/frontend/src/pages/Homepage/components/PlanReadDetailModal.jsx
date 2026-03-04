/**
 * Modal for viewing plan/timeline item (event or task). Stub; restore full component from branch if needed.
 */
export function PlanReadDetailModal({
  item,
  styles: stylesProp,
  onClose,
  onEditTask,
  onDeleteTask,
  onEditEvent,
  onDeleteEvent,
}) {
  if (!item) return null;
  const { event, task } = item;
  const title = event?.title || task?.title || "Details";
  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          maxWidth: 400,
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}>
            ×
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b5f57" }}>
          {event ? "Calendar event" : "Task"} — use calendar or task list to edit.
        </p>
      </div>
    </div>
  );
}
