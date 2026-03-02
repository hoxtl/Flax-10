import { useTags } from "../../context/TagContext";
import { countByType } from "./utils/pillUtils";
import styles from "./TagFilterRail.module.css";

function getOptions(tags) {
  return [{ key: "all", label: "All events" }, ...tags.map((tag) => ({ key: tag.label.toLowerCase(), label: tag.label }))];
}

function isActiveFilter(active, key) {
  if (Array.isArray(active)) return active.includes(key);
  return active === key;
}

function FilterOption({ option, count, active, onChange }) {
  const selected = isActiveFilter(active, option.key);
  return (
    <button type="button" className={`${styles.option} ${selected ? styles.optionActive : ""}`} onClick={() => onChange(option.key)}>
      <span className={`${styles.check} ${selected ? styles.checkActive : ""}`} aria-hidden="true">{selected ? "✓" : ""}</span>
      <span className={styles.label}>{option.label}</span>
      <span className={styles.count}>{count}</span>
    </button>
  );
}

export default function TagFilterRail({ active, onChange, items }) {
  const { tags } = useTags();
  const counts = countByType(items);
  const options = getOptions(tags);

  return (
    <aside className={styles.rail} aria-label="Tag filters">
      <h3 className={styles.title}>Filters</h3>
      <div className={styles.list}>
        {options.map((option) => (
          <FilterOption key={option.key} option={option} count={counts[option.key] || 0} active={active} onChange={onChange} />
        ))}
      </div>
    </aside>
  );
}
