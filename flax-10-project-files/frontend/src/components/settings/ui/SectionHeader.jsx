/*
 * Section heading block used in settings forms.
 */

import styles from "../../../pages/settings/styles/Settings.module.css";

export default function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.formDescription}>{description}</p> : null}
    </div>
  );
}
