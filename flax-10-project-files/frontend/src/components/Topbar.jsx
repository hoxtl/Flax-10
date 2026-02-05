import styles from "./TopBar.module.css";
import { DAYS, MONTHS } from "../lib/uiConstants";
import { getGreeting } from "../lib/dateUtils";
import { getInitials } from "../lib/userUtils";


function TopBarGreeting({ user }) {
  const now = new Date();

  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
         <h1 className={styles.name}>{user?.name?.split(" ")[0] || "Guest"}</h1>
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

function TopBarActions({ onAddClick, user }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <AddButton onClick={onAddClick} />
      <div className={styles.avatar}>
        {getInitials(user?.name) || "?"}
      </div>
    </div>
  );
}

export default function TopBar({ onToggle, onAddClick, user }) {
  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle}>
          ☰
        </button>
        <TopBarGreeting user={user} />
      </div>
      <TopBarActions onAddClick={onAddClick} user={user} />
    </header>
  );
}
