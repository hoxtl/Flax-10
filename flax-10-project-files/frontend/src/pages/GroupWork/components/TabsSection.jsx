/*
 * GroupWork detail tabs.
 */

import GroupTasksTab from "../GroupTasksTab";
import AvailabilityTab from "../AvailabilityTab";
import styles from "./TabsSection.module.css";

const DETAIL_TABS = [
  { id: "tasks", label: "Tasks" },
  { id: "availability", label: "Availability" },
];

export default function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate }) {
  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabsRow}>
        {DETAIL_TABS.map((tab) => <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={setActiveTab} />)}
      </div>
      <div className={styles.tabContent}>
        {activeTab === "tasks" ? <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} /> : <AvailabilityTab projectId={projectId} />}
      </div>
    </section>
  );
}

function TabButton({ tab, activeTab, onClick }) {
  return <button type="button" className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`} onClick={() => onClick(tab.id)}>{tab.label}</button>;
}
