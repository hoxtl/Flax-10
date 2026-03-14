import { useState, useEffect, useRef } from "react";


export function LocationAutocomplete({ value, onChange, placeholder = "Enter location" }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
}