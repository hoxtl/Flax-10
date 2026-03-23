/*
 * GroupWork detail tabs.
 */

import Tabs from "../../../components/common/Tabs/Tabs";
import GroupTasksTab from "../GroupTasksTab";
import AvailabilityTab from "../AvailabilityTab";
import ProjectProgress from "./ProjectProgress";
import styles from "./TabsSection.module.css";

export default function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate, taskStats }) {
  const tabs = [
    { id: "tasks", icon: "📝", label: "Tasks", content: <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} /> },
    { id: "availability", icon: "🤝", label: "Schedule meeting slots", content: <AvailabilityTab projectId={projectId} /> },
  ];
  return (
    <section className={styles.tabsSection}>
      <ProjectProgress taskStats={taskStats} />
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        layoutId="group-project-detail-tabs"
        tabVariant="heading"
        className={styles.sharedTabs}
      />
    </section>
  );
}
