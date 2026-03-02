import { Bell } from "lucide-react";

import { useNotifications } from "../../context/NotificationContext";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "../common/SearchBar";

import styles from "./TopBar.module.css";

function TopBarGreeting() {
  return (
    <div className={styles.greeting}>
      <span className={styles.bigTime}>StudyFlax</span>
      <span className={styles.dateSub}>Built for calm study</span>
    </div>
  );
}

function SearchInput() {
    return <SearchBar placeholder="Search…" className={styles.searchCompact} />;
}

function QuickTabs() {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [
    { title: "Notifications", icon: Bell, badge: unreadCount },
  ];
  const handleChange = (index) => {
    if (index === 0) togglePanel();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill() {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs />
      <NotificationPanel />
    </div>
  );
}

function TopBarActions({ user, onSettingsClick, onLogoutClick, onProfileClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ActionPill />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}

export default function TopBar({ user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  return (
    <header className={styles.container}>
      <TopBarGreeting />
      <TopBarActions
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </header>
  );
}
