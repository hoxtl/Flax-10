/**
 * Context menu for timeline event. Stub so TimelineRow builds.
 */
export function ContextMenu({ x, y, item, onEdit, onDelete, onClose }) {
  if (item == null) return null;
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 199 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        aria-hidden
      />
      <div
        role="menu"
        style={{
          position: "fixed",
          left: x,
          top: y,
          zIndex: 200,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          padding: "0.25rem 0",
          minWidth: 120,
        }}
      >
        {onEdit && (
          <button
            type="button"
            role="menuitem"
            style={{ display: "block", width: "100%", padding: "0.4rem 0.75rem", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: "0.875rem" }}
            onClick={() => { onEdit(item); onClose(); }}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            role="menuitem"
            style={{ display: "block", width: "100%", padding: "0.4rem 0.75rem", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: "0.875rem", color: "#b91c1c" }}
            onClick={() => { onDelete(item.id); onClose(); }}
          >
            Delete
          </button>
        )}
      </div>
    </>
  );
}
