import { useState, useEffect, useRef } from "react";
import styles from './LocationAutocomplete.module.css';

export function LocationAutocomplete({ value, onChange, placeholder = "Enter location" }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const justSelectedRef = useRef(false);

    useEffect(() => {
        if (justSelectedRef.current) {
            return;
        }

        if (!value || value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            await fetchSuggestions(value);
        }, 300)

        return () => clearTimeout(timeoutId);
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query) => {
        setIsLoading(true);
        try {
            const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
            const encodedQuery = encodeURIComponent(query);

            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
                `access_token=${mapboxToken}&` +
                `country=GB&` +
                `proximity=-0.1276,51.5074&` +
                `limit=5&` +
                `types=address,poi,place`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.features) {
                setSuggestions(data.features);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error when geocoding: ', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        justSelectedRef.current = true;
        onChange(suggestion.place_name);
        setSuggestions([]);
        setShowSuggestions(false);

        setTimeout(() => {
            justSelectedRef.current = false;
        }, 200);
    };

    const handleInputChange = (e) => {
        onChange(e.target.value);
        if (e.target.value.length >= 3) {
            setShowSuggestions(true);
        }
    };

    const handleInputFocus = () => {
        if (justSelectedRef.current) {
            return;
        }

        if (suggestions.length > 0 && value.length >= 3) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={styles.input}
            autoComplete="off"
        />

        {isLoading && value.length >= 3 && (
            <div className={styles.loadingIndicator}>
            <span className={styles.spinner} />
            </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
            {suggestions.map((suggestion) => (
                <div
                key={suggestion.id}
                className={styles.suggestionItem}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                }}
                >
                <div className={styles.suggestionIcon}>📍</div>
                <div className={styles.suggestionText}>
                    <div className={styles.suggestionName}>
                    {suggestion.text}
                    </div>
                    <div className={styles.suggestionAddress}>
                    {suggestion.place_name}
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}

        {showSuggestions && value.length >= 3 && suggestions.length === 0 && !isLoading && (
            <div className={styles.suggestionsDropdown}>
            <div className={styles.noResults}>
                No locations found. You can still save this manually.
            </div>
            </div>
        )}
        </div>
    );
}