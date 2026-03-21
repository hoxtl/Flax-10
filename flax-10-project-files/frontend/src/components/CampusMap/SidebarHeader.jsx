import styles from '../../pages/CampusMap/CampusMap.module.css';
import PageHeader from '../../components/common/PageHeader/PageHeader';

export function SidebarHeader() {
  return (
    <section className={styles.sidebarHeader}>
      <div className={styles.sidebarTitle}>
        <span className={styles.sidebarIcon}>🌎</span>
        StudyFlax Map
      </div>
      <p className={styles.sidebarSubtitle}>Never be late, plan your journeys!</p>
    </section>
  );
}
