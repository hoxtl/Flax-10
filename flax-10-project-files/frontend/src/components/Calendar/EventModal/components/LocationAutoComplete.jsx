import { useState, useEffect, useRef } from "react";
import styles from './LocationAutocomplete.module.css';
function useClickOutside(ref, callback) {
    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) callback();
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, callback]);
}
function buildMapboxUrl(query) {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const q = encodeURIComponent(query);
    const baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
    return `${baseUrl}/${q}.json?access_token=${token}&country=GB&proximity=-0.1276,51.5074&limit=5&types=address,poi,place`;
}
function useLocationSuggestions(value, userHasTyped) {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (!userHasTyped.current || !value || value.length < 3) return;
        const fetchGeocode = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(buildMapboxUrl(value));
                const data = await res.json();
                setSuggestions(data.features || []);
            } catch (err) { setSuggestions([]); }
            finally { setIsLoading(false); }
        };
        const tid = setTimeout(fetchGeocode, 300);
        return () => clearTimeout(tid);
    }, [value, userHasTyped]);
    return { suggestions, setSuggestions, isLoading };
}
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
function useLocationHandlers(onChange, setShow, suggestions, value) {
    const justSelected = useRef(false);
    return {
        handleSelect: (s) => {
            justSelected.current = true; onChange(s.place_name); setShow(false);
            setTimeout(() => { justSelected.current = false; }, 200);
        },
        onInputChange: (e) => {
            onChange(e.target.value);
            if (e.target.value.length >= 3) setShow(true);
        },
        onInputFocus: () => {
            if (!justSelected.current && suggestions.length > 0 && value.length >= 3) setShow(true);
        }
    };
}
export function LocationAutocomplete({ value, onChange, placeholder = "Enter location" }) {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef(null);
    const userHasTyped = useRef(false);
    const { suggestions, setSuggestions, isLoading } = useLocationSuggestions(value, userHasTyped);
    useClickOutside(wrapperRef, () => setShow(false));
    const h = useLocationHandlers(onChange, setShow, suggestions, value);
    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
            <input type="text" value={value} onChange={(e) => { userHasTyped.current = true; h.onInputChange(e); }} 
                onFocus={h.onInputFocus} placeholder={placeholder} className={styles.input} autoComplete="off" />
            <Dropdown suggestions={suggestions} onSelect={h.handleSelect} value={value} isLoading={isLoading} show={show} />
        </div>
    );
}