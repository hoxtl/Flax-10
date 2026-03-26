/**
 * TagFilterBar provides a horizontal list of toggleable pills for filtering
 * society events by their assigned category/tags.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/tags/TagFilterBar.jsx

import BasePill from "../../../tags/BasePill";
=======
import BasePill from "../../../Tags/BasePill";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/tags/TagFilterBar.jsx
import styles from "./TagFilterBar.module.css";

export default function TagFilterBar({ tags, activeFilters = [], onFilterChange }) {
    if (!tags || tags.length === 0) return null;

    const isAllActive = activeFilters.length === 0;
    const toggleTag = (tagId) => {
        if (activeFilters.includes(tagId)) onFilterChange(activeFilters.filter(id => id !== tagId));
        else onFilterChange([...activeFilters, tagId]);
    };

    return (
        <div className={styles.filterBar}>
            <BasePill label="All" isActive={isAllActive} onClick={() => onFilterChange([])} />
            {tags.map(tag => (
                <BasePill key={tag.id} label={tag.label} color={tag.color}
                    isActive={activeFilters.includes(tag.id)} onClick={() => toggleTag(tag.id)} />
            ))}
        </div>
    );
}
