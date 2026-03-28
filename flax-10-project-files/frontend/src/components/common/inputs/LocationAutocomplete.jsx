/*
 * Location autocomplete input with KCL building/campus suggestions.
 */

import { useState, useRef, useEffect } from 'react';
import styles from './LocationAutocomplete.module.css';

const KCL_LOCATIONS = [
  'Strand Campus',
  'Bush House',
  'Bush House NE Wing',
  'Bush House NW Wing',
  'Bush House SE Wing',
  'Bush House SW Wing',
  'Strand Building',
  "King's Building",
  'Somerset House',
  'Macadam Building',
  'Chesham Building',
  '22 Kingsway',
  "Guy's Campus",
  "Guy's Tower",
  "New Hunt's House",
  "Shepherd's House",
  'Waterloo Campus',
  'Franklin-Wilkins Building',
  'Waterloo Bridge Wing',
  "St Thomas' Campus",
  "St Thomas' Hospital",
  'Denmark Hill Campus',
  'Golden Jubilee Wing',
  'Online (Teams)',
  'Online (Zoom)',
];

function filterLocations(value) {
  const query = (value || '').toLowerCase();
  return query.length > 0 ? KCL_LOCATIONS.filter(loc => loc.toLowerCase().includes(query)) : KCL_LOCATIONS;
}

function useDropdownClose(wrapRef, setOpen) {
  useEffect(() => {
    function onOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [wrapRef, setOpen]);
}

function LocationDropdown({ options, onSelect }) {
  return (
    <ul className={styles.dropdown}>
      {options.map(loc => (
        <li key={loc} className={styles.option} onMouseDown={() => onSelect(loc)}>{loc}</li>
      ))}
    </ul>
  );
}

/** Autocomplete text input filtered against known KCL campus locations. */

export default function LocationAutocomplete({ value, onChange, placeholder, inputClassName }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useDropdownClose(wrapRef, setOpen);
  const filtered = filterLocations(value);
  const handleChange = (e) => { onChange(e.target.value); setOpen(true); };
  const handleSelect = (loc) => { onChange(loc); setOpen(false); };
  return (
    <div ref={wrapRef} className={styles.wrap}>
      <input type="text" value={value || ''} onChange={handleChange} onFocus={() => setOpen(true)} placeholder={placeholder || 'e.g., Bush House, 2.09'} className={inputClassName} autoComplete="off" />
      {open && filtered.length > 0 && <LocationDropdown options={filtered} onSelect={handleSelect} />}
    </div>
  );
}
