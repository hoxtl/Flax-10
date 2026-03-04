/**
 * Detail overlay for a timeline event. Stub so TimelineRow builds.
 */
export function DetailOverlay({ item, icon, accentColor, onClose }) {
  if (!item) return null;
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
          borderRadius: 12,
          padding: "1rem 1.25rem",
          maxWidth: 360,
          width: "90%",
          borderLeft: `4px solid ${accentColor || "#94A3B8"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>{icon ?? "📅"}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}>
            ×
          </button>
        </div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{item.title}</h3>
        {item.start_time && <p style={{ margin: 0, fontSize: "0.875rem", color: "#78716c" }}>{new Date(item.start_time).toLocaleString()}</p>}
      </div>
    </div>
  );
}
