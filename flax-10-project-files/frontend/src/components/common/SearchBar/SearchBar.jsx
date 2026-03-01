import styles from "./SearchBar.module.css";

export default function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
    const handleChange = (e) => onChange?.(e.target.value);
    const containerClass = className ? `${styles.container} ${className}` : styles.container;

    return (
        <div className={containerClass}>
            <span className={styles.icon}>🔍</span>
            <input
                className={styles.input}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
            />
        </div>
    );
}
