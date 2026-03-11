export const containerStyle = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "32px 24px 40px",
  color: "var(--text)",
};

export const listStyle = {
  marginTop: 16,
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--card-bg)",
};

export const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  marginBottom: 6,
  cursor: "pointer",
};

export const metaStyle = { fontSize: 12, color: "var(--text-secondary)" };

export const detailTabsRowStyle = {
  display: "flex",
  gap: 12,
  borderBottom: "1px solid var(--border)",
  marginTop: 24,
  paddingBottom: 15,
};

export const detailTabStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  background: active ? "var(--primary)" : "transparent",
  color: active ? "white" : "var(--text-secondary)",
  transition: "all 0.2s ease",
});

export const detailCardStyle = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--card-bg)",
  padding: "16px 18px",
};

