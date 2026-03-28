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

export default function LocationAutocomplete({ value, onChange, placeholder, inputClassName }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const normalizedValue = (value || '').toLowerCase();

  const filtered = normalizedValue.length > 0
    ? KCL_LOCATIONS.filter(loc => loc.toLowerCase().includes(normalizedValue))
    : KCL_LOCATIONS;

  useEffect(() => {
    function onOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (loc) => {
    onChange(loc);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'e.g., Bush House, 2.09'}
        className={inputClassName}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map(loc => (
            <li key={loc} className={styles.option} onMouseDown={() => handleSelect(loc)}>
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
