import { forwardRef } from "react";

import styles from "./SearchBar.module.css";

const SearchBar = forwardRef(function SearchBar(
    { value, onChange, placeholder = "Search...", className = "", onFocus, onBlur, inputClassName = "", ...inputProps },
    ref
) {
    const handleChange = (e) => onChange?.(e.target.value);
    const containerClass = className ? `${styles.container} ${className}` : styles.container;
    const resolvedInputClassName = inputClassName ? `${styles.input} ${inputClassName}` : styles.input;

    return (
        <div className={containerClass}>
            <span className={styles.icon}>🔍</span>
            <input
                ref={ref}
                className={resolvedInputClassName}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                onFocus={onFocus}
                onBlur={onBlur}
                {...inputProps}
            />
        </div>
    );
});

export default SearchBar;
