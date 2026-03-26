/*
 * Shared context card used across settings panels.
 */
<<<<<<< HEAD

import styles from "../../pages/settings/Settings.module.css";
=======
import styles from "../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export default function SettingsContextCard({
  emoji,
  title,
  body,
  items,
<<<<<<< HEAD
  className = "",
}) {
  return (
    <div className={`${styles.contextCard} ${className}`.trim()}>
=======
}) {
  return (
    <div className={styles.contextCard}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <span className={styles.contextCardEmoji}>{emoji}</span>
      <h3 className={styles.contextCardTitle}>{title}</h3>
      {body ? <p className={styles.contextCardBody}>{body}</p> : null}
      <ul className={styles.contextCardList}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
