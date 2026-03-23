import styles from './LocationAutocomplete.module.css';
import { useLocationAutocomplete } from "./useLocationAutocomplete";
function SuggestionItem({ suggestion, onClick }) {
    return (
        <div className={styles.suggestionItem} onMouseDown={(e) => { e.preventDefault(); onClick(suggestion); }}>
            <div className={styles.suggestionIcon}>📍</div>
            <div className={styles.suggestionText}>
                <div className={styles.suggestionName}>{suggestion.text}</div>
                <div className={styles.suggestionAddress}>{suggestion.place_name}</div>
            </div>
        </div>
    );
}
function Dropdown({ suggestions, onSelect, value, isLoading, show }) {
    if (!show || value.length < 3) return null;
    if (isLoading) return <div className={styles.loadingIndicator}><span className={styles.spinner} /></div>;
    if (suggestions.length === 0) return (
        <div className={styles.suggestionsDropdown}>
            <div className={styles.noResults}>No locations found. You can still save this manually.</div>
        </div>
    );
    return (
        <div className={styles.suggestionsDropdown}>
            {suggestions.map((s) => <SuggestionItem key={s.id} suggestion={s} onClick={onSelect} />)}
        </div>
    );
}
export function LocationAutocomplete({ value, onChange, placeholder = "Enter location" }) {
    const { wrapperRef, show, suggestions, isLoading, handleSelect, handleInputChange, handleInputFocus } = useLocationAutocomplete(value, onChange);
    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
            <input type="text" value={value} onChange={handleInputChange}
                onFocus={handleInputFocus} placeholder={placeholder} className={styles.input} autoComplete="off" />
            <Dropdown suggestions={suggestions} onSelect={handleSelect} value={value} isLoading={isLoading} show={show} />
        </div>
    );
}
