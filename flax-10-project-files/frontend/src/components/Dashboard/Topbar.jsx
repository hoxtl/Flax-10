import styles from "./Topbar.module.css";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../Timer/MiniTimer";
import { Bell } from "lucide-react";

function TopBarGreeting() {
  return (
    <div className={styles.greeting}>
      <span className={styles.bigTime}>StudyFlax</span>
      <span className={styles.dateSub}>Built for calm study</span>
    </div>
  );
}

function SearchInput() {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon}>🔍</span>
      <input className={styles.searchInput} placeholder="Search…" />
    </div>
  );
}

function NotificationTab() {
  const { togglePanel, closePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [{ title: "Notifications", icon: Bell, badge: unreadCount }];
  const handleChange = (index) => {
    if (index === 0) togglePanel();
    if (index === null) closePanel();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill() {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <NotificationTab />
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
      <MiniTimer onNavigate={onNavChange} activeNav={activeNav} />
      <TopBarActions
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </header>
  );
}
