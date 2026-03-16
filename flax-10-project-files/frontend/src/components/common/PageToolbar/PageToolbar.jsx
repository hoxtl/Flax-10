import styles from "./PageToolbar.module.css";

export function ToolbarSortControl({ label = "SORT", children, className = "" }) {
    const classNames = className ? `${styles.sortControl} ${className}` : styles.sortControl;
    return (
        <div className={classNames}>
            <label className={styles.sortLabel}>{label}</label>
            {children}
        </div>
    );
}

export default function PageToolbar({ searchSlot, controlsSlot, className = "" }) {
    const classNames = className ? `${styles.toolbar} ${className}` : styles.toolbar;
    return (
        <div className={classNames}>
            {searchSlot && <div className={styles.searchSlot}>{searchSlot}</div>}
            {controlsSlot && <div className={styles.controls}>{controlsSlot}</div>}
        </div>
    );
}
