/*
 * Shared context card used across settings panels.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/settings/components/SettingsContextCard.jsx
import styles from "../../../pages/settings/styles/Settings.module.css";
=======
import styles from "../../pages/settings/Settings.module.css";
>>>>>>> main:flax-10-project-files/frontend/src/components/settings/SettingsContextCard.jsx

export default function SettingsContextCard({
  emoji,
  title,
  body,
  items,
  className = "",
}) {
  return (
    <div className={`${styles.contextCard} ${className}`.trim()}>
      <span className={styles.contextCardEmoji}>{emoji}</span>
      <h3 className={styles.contextCardTitle}>{title}</h3>
      {body ? <p className={styles.contextCardBody}>{body}</p> : null}
      <ul className={styles.contextCardList}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
