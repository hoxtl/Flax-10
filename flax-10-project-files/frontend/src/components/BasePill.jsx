import styles from "./PillFilters.module.css";

export default function BasePill({ label, count, isActive, onClick }) {
    const className = isActive ? `${styles.pill} ${styles.active}` : `${styles.pill} ${styles.inactive}`;

    return (
        <button type="button" className={className} onClick={onClick}>
            <span className={styles.count}>{count}</span> {label}
        </button>
    );
}