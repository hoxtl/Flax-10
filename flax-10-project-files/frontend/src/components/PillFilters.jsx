import { useState } from "react";
import styles from "./PillFilters.module.css";
import { countByType } from "../utils/pillUtils";
import { useTags } from "../context/TagContext";
import TagManagerModal from "./TagManagerModal";

function cls(isActive) {
  return isActive ? `${styles.pill} ${styles.active}` : `${styles.pill} ${styles.inactive}`;
}

function PillButton({ pill, isActive, count, onClick }) {
  return (
    <button type="button" className={cls(isActive)} onClick={onClick}>
      <span className={styles.count}>{count}</span> {pill.label}
    </button>
  );
}

function getAllPills(tags) {
  return [{ key: "all", label: "All" }, ...tags.map(t => ({ key: t.label.toLowerCase(), label: t.label }))];
}

function checkActive(active, key) {
  if (Array.isArray(active)) return active === key || active.includes(key);
  return active === key;
}

function PillItem({ pill, active, counts, onChange }) {
  const isActive = checkActive(active, pill.key);
  return <PillButton pill={pill} isActive={isActive} count={counts[pill.key] || 0} onClick={() => onChange(pill.key)} />;
}

function ManagerButton({ onClick }) {
  return <button className={`${styles.pill} ${styles.inactive}`} onClick={onClick} aria-label="Manage Tags">✎</button>;
}

function PillRow({ pills, active, counts, onChange, onManage }) {
  return (
    <div className={styles.row}>
      {pills.map((p) => <PillItem key={p.key} pill={p} active={active} counts={counts} onChange={onChange} />)}
      <ManagerButton onClick={onManage} />
    </div>
  );
}

export default function PillFilters({ active, onChange, items }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  return (
    <>
      <PillRow pills={getAllPills(tags)} active={active} counts={countByType(items)} onChange={onChange} onManage={() => setShowManager(true)} />
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}