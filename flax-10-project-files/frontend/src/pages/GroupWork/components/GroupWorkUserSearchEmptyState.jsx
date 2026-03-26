/*
 * Shared empty-state wrapper for inline GroupWork user searches.
 */

import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";

function getEmptyStateProps({ query, clear, className, titleClassName, hintClassName }) {
  return {
    query,
    itemLabel: "users",
    title: "No teammates found",
    hint: "Try a different name or username.",
    onClear: clear,
    className,
    titleClassName,
    hintClassName,
  };
}

export default function GroupWorkUserSearchEmptyState({
  query,
  clear,
  wrapperClassName,
  className,
  titleClassName,
  hintClassName,
}) {
  const emptyStateProps = getEmptyStateProps({ query, clear, className, titleClassName, hintClassName });
  return (
    <div className={wrapperClassName}>
      <SearchEmptyState {...emptyStateProps} />
    </div>
  );
}
