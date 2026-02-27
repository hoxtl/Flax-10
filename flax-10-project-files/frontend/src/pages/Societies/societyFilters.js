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

export function getCategoryLabel(categoryId) {
    const category = SOCIETY_CATEGORY_OPTIONS.find(c => c.id === categoryId);
    return category?.label || categoryId;
}

export function matchesCategory(society, filterId) {
    if (filterId === "all") return true;
    const filter = SOCIETY_CATEGORIES.find(c => c.id === filterId);
    if (!filter) return society.category === filterId;
    const validCategories = filter.includes || [filter.id];
    return validCategories.includes(society.category);
}

export function countByCategory(societies, filterId) {
    const filter = SOCIETY_CATEGORIES.find(c => c.id === filterId);
    if (!filter) return societies.filter(s => s.category === filterId).length;
    const validCategories = filter.includes || [filter.id];
    return societies.filter(s => validCategories.includes(s.category)).length;
}
