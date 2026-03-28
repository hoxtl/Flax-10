/**
 * TagFilterBar provides a horizontal list of toggleable pills for filtering
 * society events by their assigned category/tags.
 */

import { TagsSelector } from "../../../common/tags_selector/TagsSelector";
import styles from "./TagFilterBar.module.css";

const ALL_TAG = { id: "__all__", label: "All" };

export default function TagFilterBar({ tags, activeFilters = [], onFilterChange }) {
    if (!tags || tags.length === 0) return null;

    const selectedTags = activeFilters.length === 0
        ? [ALL_TAG]
        : tags.filter((tag) => activeFilters.includes(tag.id));

    const handleSelectionChange = (nextSelection) => {
        const nextIds = nextSelection.map((tag) => tag.id).filter((id) => id !== ALL_TAG.id);
        const includesAll = nextSelection.some((tag) => tag.id === ALL_TAG.id);
        const hadAllSelected = selectedTags.some((tag) => tag.id === ALL_TAG.id);
        if (nextSelection.length === 0) {
            onFilterChange([]);
            return;
        }
        if (includesAll) {
            onFilterChange(hadAllSelected ? nextIds : []);
            return;
        }
        onFilterChange(nextIds);
    };

    return (
        <div className={styles.filterBar}>
            <TagsSelector
                className={styles.selector}
                tags={[ALL_TAG, ...tags]}
                selectedTags={selectedTags}
                onSelectionChange={handleSelectionChange}
                emptyHint="All"
                variant="inline"
            />
        </div>
    );
}
