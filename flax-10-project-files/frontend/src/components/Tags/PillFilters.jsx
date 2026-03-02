import { useState } from "react";
import { Settings2 } from "lucide-react";
import styles from "./PillFilters.module.css";
import { countByType } from "./utils/pillUtils";
import { useTags } from "../../context/TagContext";
import TagManagerModal from "./TagManagerModal";
import BasePill from "./BasePill";
import AnimatedDropdown from "../ui/AnimatedDropdown";

export default function PillFilters({ active, onChange, items, compact = false }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  const counts = countByType(items);
  const pills = getAllPills(tags, counts);
  if (compact) return <CompactFilters active={active} onChange={onChange} pills={pills} counts={counts} onManage={() => setShowManager(true)} showManager={showManager} closeManager={() => setShowManager(false)} />;
  const rowClass = styles.row;
  return (
    <>
      <div className={rowClass}>
        {pills.map((p) => (
          <PillItem
            key={p.key} pill={p} active={active}
            counts={counts} onChange={onChange}
          />
        ))}
        <ManagerButton onClick={() => setShowManager(true)} />
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}

function CompactFilters({ active, onChange, pills, counts, onManage, showManager, closeManager }) {
  const options = pills.filter((pill) => pill.key === "all" || counts[pill.key] > 0 || checkActive(active, pill.key));
  const selectedKey = getSelectedKey(active, options);
  const selectedDisplay = toDropdownValue(getPillLabel(selectedKey, options), counts[selectedKey] || 0);
  const dropdownOptions = options.map((pill) => toDropdownValue(pill.label, counts[pill.key] || 0));
  const optionMap = Object.fromEntries(options.map((pill) => [toDropdownValue(pill.label, counts[pill.key] || 0), pill.key]));
  return (
    <>
      <div className={styles.compact}>
        <div className={styles.compactDropdown}>
          <AnimatedDropdown
            value={selectedDisplay}
            onChange={(displayValue) => onChange(optionMap[displayValue] || "all")}
            placeholder="Filter by tag"
            options={dropdownOptions}
          />
        </div>
        <button className={styles.manageIconBtn} onClick={onManage} title="Manage tags" aria-label="Manage tags"><Settings2 size={15} /></button>
      </div>
      {showManager && <TagManagerModal onClose={closeManager} />}
    </>
  );
}

function getSelectedKey(active, options) {
  const keys = Array.isArray(active) ? active : [active];
  return keys.find((key) => options.some((option) => option.key === key)) || "all";
}

function getPillLabel(key, options) {
  return options.find((pill) => pill.key === key)?.label || "All";
}

function toDropdownValue(label, count) {
  return `${label} (${count})`;
}

/**
 * Combines the static 'All' option with dynamic tags from context.
 */
function getAllPills(tags, counts) {
  const seen = new Set();
  const unique = [];
  for (const tag of tags) {
    const key = tag.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ key, label: tag.label });
  }
  for (const key of Object.keys(counts)) {
    if (key === "all" || key === "ratified" || key === "unratified" || seen.has(key)) continue;
    seen.add(key);
    unique.push({ key, label: toLabel(key) });
  }
  return [{ key: "all", label: "All" }, ...unique];
}

function toLabel(key) {
  if (key === "other") return "Untagged";
  return key.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Renders an individual pill button.
 */
function PillItem({ pill, active, counts, onChange }) {
  const isActive = checkActive(active, pill.key);
  return (
    <BasePill
      label={pill.label}
      count={counts[pill.key] || 0}
      isActive={checkActive(active, pill.key)}
      onClick={() => onChange(pill.key)}
    />
  );
}

/**
 * Checks if a specific key is currently active in the filter state.
 * Handles both string (single) and array (multi) active states.
 */
function checkActive(active, key) {
  if (Array.isArray(active)) return active === key || active.includes(key);
  return active === key;
}

function ManagerButton({ onClick }) {
  return <button className={`${styles.pill} ${styles.inactive}`} onClick={onClick} aria-label="Manage tags">Manage tags</button>;
}

function PillRow({ pills, active, counts, onChange, onManage }) {
  return (
    <div className={styles.row}>
      {pills.map((p) => <PillItem key={p.key} pill={p} active={active} counts={counts} onChange={onChange} />)}
      <ManagerButton onClick={onManage} />
    </div>
  );
}
