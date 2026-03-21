/*
 * Empty state shown when a search query returns no results.
 */

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
}) {
  const queryActive = String(query || "").trim().length > 0;
  const shouldShowClear = Boolean(onClear) && (queryActive || alwaysShowClear);
  return (
    <div className={styles.card}>
      <span className={styles.emoji} aria-hidden="true">🔍</span>
      <p className={styles.title}>{resolveTitle(query, title, itemLabel)}</p>
      <p className={styles.hint}>{hint}</p>
      {shouldShowClear && (
        <PrimaryButton type="button" className={styles.clearBtn} variant="secondary" size="small" pill onClick={onClear} aria-label="Clear search">
          {clearLabel}
        </PrimaryButton>
      )}
    </div>
  );
}
