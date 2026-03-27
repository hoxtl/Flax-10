/**
 * Campus map sidebar header.
 */

import styles from '../../pages/campus_map/styles/CampusMap.module.css';
import PageHeader from '../common/page_header/PageHeader';

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
