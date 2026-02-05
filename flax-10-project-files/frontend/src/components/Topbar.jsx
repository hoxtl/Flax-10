import styles from "./TopBar.module.css";
import { DAYS, MONTHS } from "../lib/uiConstants";
import { getGreeting } from "../lib/dateUtils";

function TopBarGreeting() {
  const now = new Date();

  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        <h1 className={styles.name}>Jane</h1>
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
      <span style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>+</span>
    </button>
  );
}

function TopBarActions({ onAddClick }) {
  return (
    <div className={styles.actions}>
      <SearchInput />
      <AddButton onClick={onAddClick} />
      <div className={styles.avatar}>JS</div>
    </div>
  );
}

export default function TopBar({ onToggle, onAddClick }) {
  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle}>
          ☰
        </button>
        <TopBarGreeting />
      </div>
      <TopBarActions onAddClick={onAddClick} />
    </header>
  );
}
