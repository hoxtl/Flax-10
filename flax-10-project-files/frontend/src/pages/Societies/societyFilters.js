export const SOCIETY_CATEGORIES = [
    { id: "sports", label: "Sports" },
    { id: "cultural", label: "Cultural" },
    { id: "academic", label: "Academic" },
    { id: "arts", label: "Arts" },
    { id: "social", label: "Social" },
    { id: "gaming", label: "Gaming" },
    { id: "music", label: "Music" },
    { id: "dance", label: "Dance" },
    { id: "religious", label: "Religious" },
    { id: "professional", label: "Professional" },
    { id: "volunteering", label: "Volunteering" },
    { id: "media", label: "Media" },
];

export const RATIFICATION_FILTERS = [
    { id: "all", label: "All" },
    { id: "ratified", label: "Ratified" },
    { id: "unratified", label: "Unratified" },
];

export function getCategoryLabel(categoryId) {
    const category = SOCIETY_CATEGORIES.find(c => c.id === categoryId);
    return category?.label || categoryId;
}
