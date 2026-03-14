import { useState, useEffect, useRef } from "react";


export function LocationAutocomplete({ value, onChange, placeholder = "Enter location" }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!value || value.length < 3) {
            setSuggestions([]);
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
            const mapboxToken = import.meta.event.VITE_MAPBOX_TOKEN;
            const encodedQuery = encodeURIComponent(query);
        }
    }
}