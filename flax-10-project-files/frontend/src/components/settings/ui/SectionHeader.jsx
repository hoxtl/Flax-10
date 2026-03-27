/*
 * Section heading block used in settings forms.
 */

<<<<<<< HEAD
import styles from "../../../pages/settings/styles/Settings.module.css";
=======
import styles from "../../../pages/settings/Settings.module.css";
>>>>>>> main

export default function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.formDescription}>{description}</p> : null}
    </div>
  );
}
