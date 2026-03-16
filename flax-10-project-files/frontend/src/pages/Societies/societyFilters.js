/**
 * societyFilters provides common utilities for classifying and 
 * filtering societies based on category and ratification status.
 */

// Display categories for filter pills (consolidated)
export const SOCIETY_CATEGORIES = [
    { id: "sports", label: "Sports" },
    { id: "cultural", label: "Cultural" },
    { id: "academic", label: "Academic", includes: ["academic", "professional"] },
    { id: "arts", label: "Arts", includes: ["arts", "music", "dance"] },
    { id: "social", label: "Social", includes: ["social", "gaming"] },
    { id: "religious", label: "Religious" },
    { id: "volunteering", label: "Volunteering" },
    { id: "media", label: "Media" },
];

// All detailed categories for forms (create/edit)
export const SOCIETY_CATEGORY_OPTIONS = [
    { id: "sports", label: "Sports" },
    { id: "cultural", label: "Cultural" },
    { id: "academic", label: "Academic" },
    { id: "arts", label: "Arts" },
    { id: "social", label: "Social" },
    { id: "religious", label: "Religious" },
    { id: "volunteering", label: "Volunteering" },
    { id: "media", label: "Media" },
];

export const RATIFICATION_FILTERS = [
    { id: "all", label: "All" },
    { id: "ratified", label: "Ratified" },
    { id: "unratified", label: "Unratified" },
];

/** Returns the human-readable label for a given category ID. */
export function getCategoryLabel(categoryId) {
    const category = SOCIETY_CATEGORY_OPTIONS.find(c => c.id === categoryId);
    return category?.label || categoryId;
}

function getSocietyCategories(society) {
    if (Array.isArray(society.categories)) return society.categories;
    return society.category ? [society.category] : [];
}

/** Determines if a society matches a category filter. */
export function matchesCategory(society, filterId) {
    if (filterId === "all") return true;
    const filter = SOCIETY_CATEGORIES.find(c => c.id === filterId);
    const validCategories = filter?.includes || [filterId];
    const societyCategories = getSocietyCategories(society);
    return societyCategories.some(cat => validCategories.includes(cat));
}

/** Counts how many societies match a specific category filter. */
export function countByCategory(societies, filterId) {
    return societies.filter(s => matchesCategory(s, filterId)).length;
}
