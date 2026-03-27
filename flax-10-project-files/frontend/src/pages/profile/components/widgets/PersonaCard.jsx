import Card from "../../../../components/common/card/Card";
import styles from "./ProfileWidgets.module.css";

function PersonaHeader({ label, emoji, peakLabel }) {
  return (
    <div className={styles.personaLeft}>
      <span className={styles.personaEmoji} role="img" aria-label={label}>{emoji}</span>
      <span className={styles.personaLabel}>{label}</span>
      {peakLabel && <span className={styles.personaPeak}>{peakLabel}</span>}
    </div>
  );
}

function buildPeakLabel(peakHour) {
  if (peakHour == null) return null;
  return `Based on your ${peakHour % 12 || 12}${peakHour >= 12 ? "pm" : "am"} peak`;
}

export { buildPeakLabel };

export function PersonaCard({ persona, peakHour }) {
  if (!persona) return null;
  return (
    <Card className={`${styles.glassCard} ${styles.personaCard}`} variant="glass">
      <PersonaHeader label={persona.label} emoji={persona.emoji} peakLabel={buildPeakLabel(peakHour)} />
      <p className={styles.personaDesc}>{persona.description}</p>
    </Card>
  );
}
