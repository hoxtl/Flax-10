/*
 * Empty state for group work user search results.
 */

import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";

function SearchEmptyStateCard({ query, clear, className, titleClassName, hintClassName }) {
  return (
    <SearchEmptyState
      query={query}
      itemLabel="users"
      onClear={clear}
      hint="Try searching by name or username."
      className={className}
      titleClassName={titleClassName}
      hintClassName={hintClassName}
    />
  );
}

/** Empty state shown when a group work user search returns nothing. */

export default function GroupWorkUserSearchEmptyState(props) {
  const content = <SearchEmptyStateCard {...props} />;
  return props.wrapperClassName ? <div className={props.wrapperClassName}>{content}</div> : content;
}
