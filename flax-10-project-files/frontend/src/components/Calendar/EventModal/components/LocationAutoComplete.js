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
    })

    const timeoutId = setTimeout(async () => {
        await fetchSuggestions(value);
    }, 300)
}