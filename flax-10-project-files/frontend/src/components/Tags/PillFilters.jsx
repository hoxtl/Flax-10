import { useState } from "react";
import styles from "./PillFilters.module.css";
import { countByType } from "./utils/pillUtils";
import { useTags } from "../../context/TagContext";
import TagManagerModal from "./TagManagerModal";
import BasePill from "./BasePill";

function getAllPills(tags) {
  return [{ key: "all", label: "All" }, ...tags.map(t => ({ key: t.label.toLowerCase(), label: t.label }))];
}

function checkActive(active, key) {
  if (Array.isArray(active)) return active === key || active.includes(key);
  return active === key;
}

function ManagerButton({ onClick }) {
  return <button className={`${styles.pill} ${styles.inactive}`} onClick={onClick} aria-label="Manage Tags">✎</button>;
}

function PillItem({ pill, active, counts, onChange }) {
  const count = counts[pill.key] || 0;
  if (pill.key !== "all" && count === 0) return null;
  return (
    <BasePill
      label={pill.label}
      count={count}
      isActive={checkActive(active, pill.key)}
      onClick={() => onChange(pill.key)}
    />
  );
}

export default function PillFilters({ active, onChange, items }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  const counts = countByType(items);
  const pills = getAllPills(tags);
  return (
    <>
      <div className={styles.row}>
        {pills.map((p) => (
          <PillItem key={p.key} pill={p} active={active} counts={counts} onChange={onChange} />
        ))}
        <ManagerButton onClick={() => setShowManager(true)} />
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}