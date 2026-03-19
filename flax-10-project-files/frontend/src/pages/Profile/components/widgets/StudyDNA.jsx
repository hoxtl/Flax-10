import Card from "../../../../components/common/Card/Card";
import styles from "./ProfileWidgets.module.css";

const DAYLIGHT_SEGMENTS = new Set(["Morning", "Afternoon", "Evening"]);

function classifyHour(h) {
  if (h >= 5 && h < 12) return 0;
  if (h >= 12 && h < 17) return 1;
  if (h >= 17 && h < 21) return 2;
  return 3;
}

function sumByPeriod(heatmap) {
  const totals = [0, 0, 0, 0];
  heatmap.data.flat().forEach((mins, idx) => { totals[classifyHour(idx % 24)] += mins; });
  return totals;
}

function computeDnaSegments(heatmap) {
  const [m, a, e, n] = sumByPeriod(heatmap);
  const t = m + a + e + n || 1;
  return [
    { label: "Morning", pct: m / t, color: "var(--color-primary-strong)" },
    { label: "Afternoon", pct: a / t, color: "var(--color-primary)" },
    { label: "Evening", pct: e / t, color: "var(--color-highlight)" },
    { label: "Night", pct: n / t, color: "color-mix(in srgb, var(--color-primary) 20%, black)" },
  ].filter(s => s.pct > 0.01);
}

function DnaBar({ segments }) {
  return (
    <div className={styles.dnaBar}>
      {segments.map((s, i) => (
        <div key={s.label} className={styles.dnaSegment} style={{ width: `${s.pct * 100}%`, background: s.color, borderRadius: i === 0 ? "5px 0 0 5px" : i === segments.length - 1 ? "0 5px 5px 0" : "0" }} />
      ))}
    </div>
  );
}

function DnaLegend({ segments }) {
  return (
    <div className={styles.dnaLegend}>
      {segments.map(s => (
        <div key={s.label} className={styles.dnaLegendItem}>
          <span className={styles.dnaDot} style={{ background: s.color }} />
          <span className={`${styles.dnaLegendLabel} ${DAYLIGHT_SEGMENTS.has(s.label) ? styles.dnaLegendLabelDark : ""}`}>{s.label}</span>
          <span className={styles.dnaLegendPct}>{Math.round(s.pct * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function StudyDNA({ heatmap }) {
  if (!heatmap?.data) return null;
  const segments = computeDnaSegments(heatmap);
  return (
    <Card className={`${styles.glassCard} ${styles.dnaCard}`} variant="glass">
      <div className={styles.cardLabel}>STUDY DNA</div>
      <DnaBar segments={segments} />
      <DnaLegend segments={segments} />
    </Card>
  );
}
