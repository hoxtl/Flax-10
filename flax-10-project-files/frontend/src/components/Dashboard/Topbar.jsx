import styles from "./Topbar.module.css";
import { DAYS, MONTHS } from "../../lib/uiConstants";
import { getGreeting } from "../Calendar/utils/dateUtils";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { getDisplayName } from "../Authentication/utils/userDisplay";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../Timer/MiniTimer";
import { Bell, Plus } from "lucide-react";
import { TypingAnimation } from "./TypingAnimation";

function getFirstName(user) {
  const displayName = (getDisplayName(user) || "").trim();
  return displayName ? displayName.split(" ")[0] : "";
}

function getCurrentDateString() {
  const now = new Date();
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

function TopBarGreeting({ user }) {
  const firstName = getFirstName(user);
  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        {!!firstName && (
          <h1 className={styles.name}>
            <TypingAnimation text={firstName} duration={180} />
          </h1>
        )}
        <span className={styles.date}>{getCurrentDateString()}</span>
      </div>
    </div>);}

function SearchInput() {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon}>🔍</span>
      <input className={styles.searchInput} placeholder="Search…" />
    </div>
  );
}

function QuickTabs({ onAddClick }) {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [
    { title: "Add", icon: Plus, autoCollapse: true },
    { type: "separator" },
    { title: "Notifications", icon: Bell, badge: unreadCount },
  ];
  const handleChange = (index) => {
    if (index === 0) onAddClick?.();
    if (index === 2) togglePanel();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill({ onAddClick }) {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs onAddClick={onAddClick} />
      <NotificationPanel />
    </div>
  );
}

function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ActionPill onAddClick={onAddClick} />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}

export default function TopBar({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  return (
    <header className={styles.container}>
      <TopBarGreeting user={user} />
      <MiniTimer onNavigate={onNavChange} activeNav={activeNav} />
      <TopBarActions
        onAddClick={onAddClick}
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </header>
  );
}
