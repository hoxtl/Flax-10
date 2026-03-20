import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from "./SearchEmptyState.module.css";

function hasQuery(query) {
  return String(query || "").trim().length > 0;
}

export default function SearchEmptyState({
  query = "",
  itemLabel = "items",
  onClear,
  title,
  alwaysShowClear = false,
  hint = "Try a different keyword or check your spelling",
  clearLabel = "Clear search",
}) {
  const queryActive = hasQuery(query);
  const shouldShowClear = Boolean(onClear) && (queryActive || alwaysShowClear);
  const resolvedTitle = title || (queryActive
    ? `No ${itemLabel} match "${query}"`
    : `No ${itemLabel} found`);

  return (
    <div className={styles.card}>
      <span className={styles.emoji} aria-hidden="true">🔍</span>
      <p className={styles.title}>{resolvedTitle}</p>
      <p className={styles.hint}>{hint}</p>
      {shouldShowClear && (
        <PrimaryButton
          type="button"
          className={styles.clearBtn}
          variant="secondary"
          size="small"
          pill
          onClick={onClear}
          aria-label="Clear search"
        >
          {clearLabel}
        </PrimaryButton>
      )}
    </div>
  );
}
