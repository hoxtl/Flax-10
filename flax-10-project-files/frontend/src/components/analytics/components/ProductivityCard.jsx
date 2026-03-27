/*
 * Productivity insight card.
 */

import styles from "../styles/SummaryCards.module.css";

function ProductivityValue({ unit, value }) {
  return <div className={styles.valueRow}><span className={styles.value}>{value ?? "—"}</span>{value != null && unit && <span className={styles.unit}>{unit}</span>}</div>;
}

function ProductivitySubtitle({ subtitle }) {
  return subtitle ? <p className={styles.label} style={{ marginTop: "0.15rem" }}>{subtitle}</p> : null;
}

export default function ProductivityCard({ color, icon, label, subtitle, unit, value }) {
  return <div className={styles.card} style={{ borderLeftColor: color }}><div className={styles.iconWrap} style={{ background: `${color}18`, color }}><span className={styles.icon}>{icon}</span></div><div className={styles.content}><p className={styles.label}>{label}</p><ProductivityValue unit={unit} value={value} /><ProductivitySubtitle subtitle={subtitle} /></div></div>;
}
