import { forwardRef } from "react";
import { Search } from "lucide-react";

import styles from "./SearchBar.module.css";
import TextInput from "../TextInput/TextInput";

const SearchBar = forwardRef(function SearchBar(
    { value, onChange, placeholder = "Search...", className = "", onFocus, onBlur, inputClassName = "", ...inputProps },
    ref
) {
    const handleChange = (e) => onChange?.(e.target.value);
    const containerClass = className ? `${styles.container} ${className}` : styles.container;
    const resolvedInputClassName = inputClassName ? `${styles.input} ${inputClassName}` : styles.input;

    return (
        <TextInput
            ref={ref}
            className={containerClass}
            inputClassName={resolvedInputClassName}
            leading={<Search size={16} strokeWidth={2} />}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            onFocus={onFocus}
            onBlur={onBlur}
            {...inputProps}
        />
    );
});

export default SearchBar;
