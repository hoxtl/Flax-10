<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Profile/components/widgets/PersonaCard.jsx
<<<<<<< HEAD
import Card from "../../../../components/common/card/Card";
=======
import Card from "../../../../components/common/Card/Card";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
=======
import Card from "../../../../components/common/Card/Card";
>>>>>>> main:flax-10-project-files/frontend/src/pages/profile/components/widgets/PersonaCard.jsx
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

export function PersonaCard({ persona, peakHour }) {
  if (!persona) return null;
  return (
    <Card className={`${styles.glassCard} ${styles.personaCard}`} variant="glass">
      <PersonaHeader label={persona.label} emoji={persona.emoji} peakLabel={buildPeakLabel(peakHour)} />
      <p className={styles.personaDesc}>{persona.description}</p>
    </Card>
  );
}
