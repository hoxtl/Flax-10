/**
 * TagFilterBar provides a horizontal list of toggleable pills for filtering
 * society events by their assigned category/tags.
 */

import { TagsSelector } from "../../../common/tags_selector/TagsSelector";
import styles from "./TagFilterBar.module.css";

const ALL_TAG = { id: "__all__", label: "All" };

function getSelectedTags(tags, activeFilters) {
    return activeFilters.length === 0 ? [ALL_TAG] : tags.filter((tag) => activeFilters.includes(tag.id));
}

function getNextFilterIds(nextSelection, selectedTags) {
    const nextIds = nextSelection.map((tag) => tag.id).filter((id) => id !== ALL_TAG.id);
    if (nextSelection.length === 0) return [];
    if (!nextSelection.some((tag) => tag.id === ALL_TAG.id)) return nextIds;
    return selectedTags.some((tag) => tag.id === ALL_TAG.id) ? nextIds : [];
}

function FilterSelector({ tags, selectedTags, onSelectionChange }) {
    return (
        <div className={styles.filterBar}>
            <TagsSelector className={styles.selector} tags={[ALL_TAG, ...tags]} selectedTags={selectedTags} onSelectionChange={onSelectionChange} emptyHint="All" variant="inline" />
        </div>
    );
}

/** Renders the tag filter controls for society events. */
export default function TagFilterBar({ tags, activeFilters = [], onFilterChange }) {
    if (!tags?.length) return null;
    const selectedTags = getSelectedTags(tags, activeFilters);
    return <FilterSelector tags={tags} selectedTags={selectedTags} onSelectionChange={(selection) => onFilterChange(getNextFilterIds(selection, selectedTags))} />;
}
