import styles from "./Topbar.module.css";
import { DAYS, MONTHS } from "../../lib/uiConstants";
import { getGreeting } from "../Calendar/utils/dateUtils";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationCenter } from "../Notifications";
import { getDisplayName } from "../Authentication/utils/userDisplay";
import ThemeToggle from "./ThemeToggle";

function getCurrentDateParts() {
  const now = new Date();
  return {
    day: DAYS[now.getDay()],
    date: now.getDate(),
    month: MONTHS[now.getMonth()],
  };
}

function TopBarGreeting({ user }) {
  const now = new Date();

  const displayName = (getDisplayName(user) || "").trim();
  const firstName = displayName ? displayName.split(" ")[0] : "";

  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        {!!firstName && <h1 className={styles.name}>{firstName}</h1>}
        <span className={styles.date}>
          {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
        </span>
      </div>
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

function AddButton({ onClick }) {
  return (
    <button className={styles.addBtn} onClick={onClick}>
      <span className={styles.addIcon}>+</span>
    </button>
  );
}

function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <ThemeToggle />
      <AddButton onClick={onAddClick} />
      <NotificationCenter />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
    </div>
  );
}

export default function TopBar({ onToggle, onAddClick, user, onSettingsClick, onLogoutClick }) {
  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle}>
          ☰
        </button>
        <TopBarGreeting user={user} />
      </div>
      <TopBarActions
        onAddClick={onAddClick}
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
    </header>
  );
}