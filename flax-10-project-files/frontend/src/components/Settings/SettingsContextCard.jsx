/*
 * Shared context card used across settings panels.
 */
import styles from "../../pages/Settings/Settings.module.css";

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
