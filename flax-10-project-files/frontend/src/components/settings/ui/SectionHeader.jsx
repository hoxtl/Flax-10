/*
 * Section heading block used in settings forms.
 */
<<<<<<< HEAD

import styles from "../../../pages/settings/Settings.module.css";
=======
import styles from "../../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export default function SectionHeader({ title, description }) {
  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.formDescription}>{description}</p> : null}
    </div>
  );
}
