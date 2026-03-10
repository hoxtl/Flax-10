export const containerStyle = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "32px 24px 40px",
};

export const listStyle = {
  marginTop: 16,
  borderRadius: 16,
  border: "1px solid #f0dfd1",
  background: "#fffbf7",
};

export const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 16px",
  marginBottom: 6,
  cursor: "pointer",
};

export const metaStyle = { fontSize: 12, color: "#8f7969" };

export const detailTabsRowStyle = {
  display: "flex",
  gap: 12,
  borderBottom: "1px solid #eee0d4",
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
  background: active ? "#3f2a20" : "transparent",
  color: active ? "#fff8f1" : "#7a6455",
});

export const detailCardStyle = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid #f0dfd1",
  background: "#fffbf7",
  padding: "16px 18px",
};

