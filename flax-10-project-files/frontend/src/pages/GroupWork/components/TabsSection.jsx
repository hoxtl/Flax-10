import React from "react";
import GroupTasksTab from "../GroupTasksTab";
import AvailabilityTab from "../AvailabilityTab";
import styles from "./TabsSection.module.css";

export default function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate }) {
  const TabButton = ({ id, label }) => (
    <button 
      type="button" 
      className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`} 
      onClick={() => setActiveTab(id)}
    >
      {label}
    </button>
  );

  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabsRow}>
        <TabButton id="tasks" label="Tasks" />
        <TabButton id="availability" label="Availability" />
      </div>
      <div className={styles.tabContent}>
        {activeTab === "tasks" && (
            <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} />
        )}
        {activeTab === "availability" && (
            <AvailabilityTab projectId={projectId} />
        )}
      </div>
    </section>
  );
}
