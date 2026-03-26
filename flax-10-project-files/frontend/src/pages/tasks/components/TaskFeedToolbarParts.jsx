/*
 * Shared toolbar pieces for task feed search and filters.
 */

import { X } from "lucide-react";

import SearchBar from "../../../components/common/search_bar";
import AnimatedDropdown from "../../../components/common/animated_dropdown";

import { TASK_SORT_OPTIONS as SORT_OPTIONS } from "../../../lib/taskSortOptions";
import styles from "./TaskFeedToolbar.module.css";

function handleSearchKeyDown(event, onSearchChange) {
  if (event.key !== "Escape") return;
  onSearchChange("");
  event.target.blur();
}

function SearchClearButton({ onSearchChange }) {
  return (
    <button
      type="button"
      className={styles.searchClear}
      onClick={() => onSearchChange("")}
      aria-label="Clear search"
    >
      <X size={12} />
    </button>
  );
}

function ViewListsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 3.25h10M2 7h10M2 10.75h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ToolbarSearch({ search, onSearchChange, searchInputRef }) {
  const fieldProps = {
    ref: searchInputRef,
    className: styles.searchField,
    inputClassName: styles.searchInput,
    placeholder: "search by list or task...",
    value: search,
    onChange: onSearchChange,
    "aria-label": "Search tasks",
    onKeyDown: (event) => handleSearchKeyDown(event, onSearchChange),
  };

  return (
    <div className={styles.searchWrap}>
      <SearchBar {...fieldProps} />
      {search && <SearchClearButton onSearchChange={onSearchChange} />}
    </div>
  );
}

export function ToolbarSort({ sortBy, onSortChange }) {
  return (
    <div className={styles.sortWrap}>
      <label className={styles.sortLabel}>SORT</label>
      <AnimatedDropdown
        value={sortBy}
        onChange={onSortChange}
        options={SORT_OPTIONS}
        className={styles.sortDropdown}
      />
    </div>
  );
}

export function ToolbarViewLists({ onOpenLists }) {
  if (!onOpenLists) return null;

  return (
    <button type="button" className={styles.viewListsBtn} onClick={onOpenLists}>
      <ViewListsIcon />
      <span>View lists</span>
    </button>
  );
}
