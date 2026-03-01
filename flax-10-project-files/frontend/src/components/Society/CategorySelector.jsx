import styles from "./CategorySelector.module.css";
import { SOCIETY_CATEGORY_OPTIONS } from "../../pages/Societies/societyFilters";

export default function CategorySelector({ value, onChange, label = "Category", multiple = false }) {
    if (multiple) return <MultiCategorySelector value={value} onChange={onChange} label={label} />;
    return <SingleCategorySelector value={value} onChange={onChange} label={label} />;
}

function SingleCategorySelector({ value, onChange, label }) {
    return (
        <div className={styles.field}>
            {label && <label className={styles.label}>{label}</label>}
            <select className={styles.select} value={value || ""} onChange={e => onChange(e.target.value)}>
                <option value="">Select a category</option>
                {SOCIETY_CATEGORY_OPTIONS.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
        </div>
    );
}

function MultiCategorySelector({ value = [], onChange, label }) {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (catId) => {
        const newValue = selected.includes(catId)
            ? selected.filter(id => id !== catId)
            : [...selected, catId];
        onChange(newValue);
    };

    return (
        <div className={styles.field}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.pillGrid}>
                {SOCIETY_CATEGORY_OPTIONS.map(cat => (
                    <CategoryPill key={cat.id} label={cat.label} selected={selected.includes(cat.id)} onClick={() => toggle(cat.id)} />
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
