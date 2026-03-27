/**
 * CategorySelector provides single or multi-select dropdowns/pills
 * for classifying societies into predefined categories.
 */

import styles from "../styles/CategorySelector.module.css";
import { SOCIETY_CATEGORY_OPTIONS } from "../../../pages/societies/utils/societyFilters";
import AnimatedDropdown from "../../common/animated_dropdown";

const CATEGORY_DROPDOWN_OPTIONS = [
    { value: '', label: 'Select a category' },
    ...SOCIETY_CATEGORY_OPTIONS.map(cat => ({ value: cat.id, label: cat.label }))
];

export default function CategorySelector({ value, onChange, label = "Category", multiple = false }) {
    if (multiple) return <MultiCategorySelector value={value} onChange={onChange} label={label} />;
    return <SingleCategorySelector value={value} onChange={onChange} label={label} />;
}

function SingleCategorySelector({ value, onChange, label }) {
    return (
        <div className={styles.field}>
            {label && <label className={styles.label}>{label}</label>}
            <AnimatedDropdown value={value || ""} onChange={onChange} options={CATEGORY_DROPDOWN_OPTIONS} placeholder="Select a category" />
        </div>
    );
}

/** Renders a grid of category pills for multi-selection. */

function MultiCategorySelector({ value = [], onChange, label }) {
    const selected = Array.isArray(value) ? value : [];
    const handleToggle = (id) => onChange(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);

    return (
        <div className={styles.field}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.pillGrid}>
                {SOCIETY_CATEGORY_OPTIONS.map(cat => (
                    <CategoryPill key={cat.id} label={cat.label}
                        selected={selected.includes(cat.id)} onClick={() => handleToggle(cat.id)} />
                ))}
            </div>
        </div>
    );
}

function CategoryPill({ label, selected, onClick }) {
    const className = selected ? `${styles.pill} ${styles.pillSelected}` : styles.pill;
    return <button type="button" className={className} onClick={onClick}>{label}</button>;
}

export function CategoryDisplay({ category, editMode, onEdit }) {
    const categories = Array.isArray(category) ? category : (category ? [category] : []);
    if (categories.length === 0 && !editMode) return null;

    return (
        <div className={styles.display}>
            {categories.map(cat => <CategoryBadge key={cat} category={cat} />)}
            {categories.length === 0 && <span className={styles.noCat}>No category</span>}
            {editMode && <button className={styles.editBtn} onClick={onEdit}>✎</button>}
        </div>
    );
}

function CategoryBadge({ category }) {
    const found = SOCIETY_CATEGORY_OPTIONS.find(c => c.id === category);
    return <span className={styles.categoryLabel}>{found?.label || category}</span>;
}
