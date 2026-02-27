import styles from "./CategorySelector.module.css";
import { SOCIETY_CATEGORY_OPTIONS } from "../../pages/Societies/societyFilters";

export default function CategorySelector({ value, onChange, label = "Category" }) {
    return (
        <div className={styles.field}>
            {label && <label className={styles.label}>{label}</label>}
            <select className={styles.select} value={value || ""} onChange={e => onChange(e.target.value)}>
                <option value="">Select a category</option>
                {SOCIETY_CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
            </select>
        </div>
    );
}

export function CategoryDisplay({ category, editMode, onEdit }) {
    const label = getCategoryDisplayLabel(category);
    if (!category && !editMode) return null;

    return (
        <div className={styles.display}>
            <span className={styles.categoryLabel}>{label}</span>
            {editMode && <button className={styles.editBtn} onClick={onEdit}>✎</button>}
        </div>
    );
}

function getCategoryDisplayLabel(category) {
    if (!category) return "No category";
    const found = SOCIETY_CATEGORY_OPTIONS.find(c => c.id === category);
    return found?.label || category;
}
