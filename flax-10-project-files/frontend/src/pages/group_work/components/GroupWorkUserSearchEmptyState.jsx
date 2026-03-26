/*
 * Empty state for the user/member search in group work forms.
 */

import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";

export default function GroupWorkUserSearchEmptyState({
  query,
  clear,
  wrapperClassName,
  className,
  titleClassName,
  hintClassName,
}) {
  return (
    <div className={wrapperClassName}>
      <SearchEmptyState
        query={query}
        itemLabel="users"
        onClear={clear}
        hint="Try searching by name or username."
        className={className}
        titleClassName={titleClassName}
        hintClassName={hintClassName}
      />
    </div>
  );
}
