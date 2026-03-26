/*
 * Location autocomplete hook with Mapbox geocoding.
 */

import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "../../../common/hooks/useClickOutside";

function buildMapboxUrl(query) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const q = encodeURIComponent(query);
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&country=GB&proximity=-0.1276,51.5074&limit=5&types=address,poi,place`;
}

async function fetchLocationSuggestions(value, setSuggestions, setIsLoading) {
  setIsLoading(true);
  try {
    const res = await fetch(buildMapboxUrl(value));
    const data = await res.json();
    setSuggestions(data.features || []);
  } catch {
    setSuggestions([]);
  } finally {
    setIsLoading(false);
  }
}

function useLocationSuggestions(value, userHasTyped) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!userHasTyped.current || !value || value.length < 3) return undefined;
    const timeoutId = setTimeout(() => fetchLocationSuggestions(value, setSuggestions, setIsLoading), 300);
    return () => clearTimeout(timeoutId);
  }, [value, userHasTyped]);
  return { suggestions, isLoading };
}

function createSelectHandler(onChange, setShow, justSelected) {
  return (suggestion) => {
    justSelected.current = true;
    onChange(suggestion.place_name);
    setShow(false);
    setTimeout(() => { justSelected.current = false; }, 200);
  };
}

function useLocationHandlers(onChange, setShow, suggestions, value) {
  const justSelected = useRef(false);
  const handleSelect = createSelectHandler(onChange, setShow, justSelected);
  const onInputChange = (event) => { onChange(event.target.value); if (event.target.value.length >= 3) setShow(true); };
  const onInputFocus = () => { if (!justSelected.current && suggestions.length > 0 && value.length >= 3) setShow(true); };
  return { handleSelect, onInputChange, onInputFocus };
}

export function useLocationAutocomplete(value, onChange) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const userHasTyped = useRef(false);
  const { suggestions, isLoading } = useLocationSuggestions(value, userHasTyped);
  const handlers = useLocationHandlers(onChange, setShow, suggestions, value);
  useClickOutside(wrapperRef, () => setShow(false));
  const handleInputChange = (event) => { userHasTyped.current = true; handlers.onInputChange(event); };
  return { wrapperRef, show, suggestions, isLoading, handleSelect: handlers.handleSelect, handleInputChange, handleInputFocus: handlers.onInputFocus };
}
