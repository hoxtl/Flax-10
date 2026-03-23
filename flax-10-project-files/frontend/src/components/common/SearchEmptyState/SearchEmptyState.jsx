/*
 * Empty state shown when a search query returns no results.
 */

import { Search } from "lucide-react";
import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from "./SearchEmptyState.module.css";

function resolveTitle(query, title, itemLabel) {
  if (title) return title;
  return String(query || "").trim().length > 0
    ? `No ${itemLabel} match "${query}"`
    : `No ${itemLabel} found`;
}

/** Empty state card displayed when a search yields no matching items. */

export default function SearchEmptyState({
  query = "", itemLabel = "items", onClear, title, alwaysShowClear = false,
  hint = "Try a different keyword or check your spelling", clearLabel = "Clear search",
  className = "", titleClassName = "", hintClassName = "", iconClassName = "", icon = <Search size={22} aria-hidden="true" />,
}) {
  const queryActive = String(query || "").trim().length > 0;
  const shouldShowClear = Boolean(onClear) && (queryActive || alwaysShowClear);
  return (
    <div className={className ? `${styles.card} ${className}` : styles.card}>
      {icon ? <span className={iconClassName ? `${styles.emoji} ${iconClassName}` : styles.emoji}>{icon}</span> : null}
      <p className={titleClassName ? `${styles.title} ${titleClassName}` : styles.title}>{resolveTitle(query, title, itemLabel)}</p>
      <p className={hintClassName ? `${styles.hint} ${hintClassName}` : styles.hint}>{hint}</p>
      {shouldShowClear && (
        <PrimaryButton type="button" className={styles.clearBtn} variant="secondary" size="small" pill onClick={onClear} aria-label="Clear search">
          {clearLabel}
        </PrimaryButton>
      )}
    </div>
  );
}
