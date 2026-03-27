/*
 * Settings sidebar navigation and related tab controls.
 */

import { Clock3, Lock, MapPin, Moon, Paintbrush, User } from "lucide-react";
import styles from "../../../pages/settings/styles/Settings.module.css";

const TAB_CONFIG = [
  { id: "account", label: "Account", icon: User, group: "My Details" },
  { id: "home", label: "Location", icon: MapPin, group: "My Details" },
  { id: "security", label: "Security", icon: Lock, group: "My Details" },
  { id: "preferences_themes", label: "Appearance", icon: Paintbrush, group: "Preferences" },
  { id: "preferences_sleep", label: "Sleep Schedule", icon: Moon, group: "Preferences" },
  { id: "preferences_scheduling", label: "Scheduling", icon: Clock3, group: "Preferences" },
];

function getProfileCompletion(user) {
  const checks = [
    Boolean(user?.first_name),
    Boolean(user?.last_name),
    Boolean(user?.email),
    Boolean(user?.major),
    Boolean(user?.year_of_study || user?.year),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function ProfileCompletion({ user }) {
  const percentage = getProfileCompletion(user);
  if (percentage >= 100) return null;

  return (
    <div className={styles.profileCompletion}>
      <div className={styles.profileCompletionHeader}>
        <span>Profile</span>
        <span>{percentage}%</span>
      </div>
      <div className={styles.profileCompletionBar}>
        <div className={styles.profileCompletionFill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SidebarButton({ tab, activeTab, onChange }) {
  const Icon = tab.icon;
  const className = `${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`;

  return (
    <button
      key={tab.id}
      className={className}
      onClick={() => onChange(tab.id)}
      aria-current={activeTab === tab.id ? "page" : undefined}
    >
      <Icon className={styles.navIcon} size={15} strokeWidth={2} />
      {tab.label}
    </button>
  );
}

function SidebarGroup({ group, activeTab, onChange, user }) {
  const tabs = TAB_CONFIG.filter((tab) => tab.group === group);

  return (
    <div className={styles.sidebarGroup} style={{ width: "100%" }}>
      <div className={styles.sidebarSectionLabel}>{group}</div>
      {tabs.map((tab) => <SidebarButton key={tab.id} tab={tab} activeTab={activeTab} onChange={onChange} />)}
    </div>
  );
}

export function SettingsSidebar({ activeTab, onChange, user }) {
  const groups = [...new Set(TAB_CONFIG.map((tab) => tab.group))];

  return (
    <aside className={styles.sidebar}>
      <ProfileCompletion user={user} />
      <nav className={styles.sidebarNav}>
        {groups.map((group) => <SidebarGroup key={group} group={group} activeTab={activeTab} onChange={onChange} user={user} />)}
      </nav>
    </aside>
  );
}

export function SettingsTabs({ activeTab, onChange }) {
  return <SettingsSidebar activeTab={activeTab} onChange={onChange} />;
}

export function TabButton({ id, label, isActive, onClick }) {
  return (
    <button className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`} onClick={() => onClick(id)}>
      {label}
    </button>
  );
}
