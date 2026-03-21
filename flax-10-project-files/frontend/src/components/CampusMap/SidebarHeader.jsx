import styles from '../../pages/CampusMap/CampusMap.module.css';
import PageHeader from '../../components/common/PageHeader/PageHeader';

export function SidebarHeader() {
  return (
    <section className={styles.sidebarHeader}>
      <PageHeader 
        title="🌎 StudyFlax Map"
        subtitle="Never be late, plan your journeys!"
      />
    </section>
  );
}
