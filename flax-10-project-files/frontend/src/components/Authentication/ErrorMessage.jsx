/*
 * Inline auth error banner.
 */

const errorStyle = {
  position: "absolute",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "var(--primary-strong)",
  color: "var(--c-white)",
  padding: "12px 24px",
  borderRadius: "8px",
  zIndex: 1000,
  maxWidth: "400px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid var(--border)",
};

export function ErrorMessage({ error }) {
  if (!error) return null;
  return <div style={errorStyle}>{error}</div>;
}
