/**
 * Custom journey planner section.
 */

import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import Tooltip from "../Common/Tooltip/Tooltip";
import { geocodeAddress } from "../../api/geocodeApi";
import styles from "./UserJourneySection.module.css";

function useGeocodedLocation(value, setCoords) {
  useEffect(() => { let active = true; if (!value.trim()) { setCoords(null); return undefined; } geocodeAddress(value).then((coords) => active && setCoords(coords)); return () => { active = false; }; }, [setCoords, value]);
}

function GeoInlineBtn({ onGeolocate, locating }) {
  return (
    <Tooltip content="Click to set current location" position="top">
      <button className={styles.geoInlineBtn} onClick={onGeolocate} disabled={locating} type="button" aria-label="Set current location">
        {locating ? '⏳' : '📍'}
      </button>
    </Tooltip>
  );
}

function FromField({ value, onChange, onGeolocate, locating }) {
  return (
    <div className={styles.manualInputGroup}>
      <label className={styles.manualLabel}>From</label>
      <div className={styles.locationInputWrapper}>
        <LocationAutocomplete value={value} onChange={onChange} placeholder="Enter a starting location" />
        <GeoInlineBtn onGeolocate={onGeolocate} locating={locating} />
      </div>
    </div>
  );
}

function JourneyField({ label, onChange, placeholder, value }) {
  return (
    <div className={styles.manualInputGroup}><label className={styles.manualLabel}>{label}</label><LocationAutocomplete value={value} onChange={onChange} placeholder={placeholder} /></div>
  );
}

function JourneyActions({ canCalculate, hasValue, onClear, onGo }) {
  return (
    <div className={styles.manualButtonGroup}><button className={styles.goButton} onClick={onGo} disabled={!canCalculate}>{canCalculate ? "Calculate Route 🚀" : "Enter both locations"}</button>{hasValue && <button className={styles.clearManualButton} onClick={onClear}>Clear</button>}</div>
  );
}

export function UserJourneySection({ manualStart, setManualStart, manualDestination, setManualDestination, onCalculate, onClearAll, onGeolocate, locating }) {
  const [startCoords, setStartCoords] = useState(null), [destCoords, setDestCoords] = useState(null), canCalculate = manualStart.trim() && manualDestination.trim() && startCoords && destCoords;
  useGeocodedLocation(manualStart, setStartCoords); useGeocodedLocation(manualDestination, setDestCoords);
  const handleClear = () => { setManualStart(""); setManualDestination(""); setStartCoords(null); setDestCoords(null); onClearAll?.(); };
  return (
    <section className={styles.section}><div className={styles.sectionLabel}><span className={styles.searchIcon}>🔍</span>Plan Custom Journey</div><div className={styles.manualJourneyInputs}><FromField value={manualStart} onChange={setManualStart} onGeolocate={onGeolocate} locating={locating} /><JourneyField label="To" value={manualDestination} onChange={setManualDestination} placeholder="Enter a destination" /><JourneyActions canCalculate={canCalculate} hasValue={manualStart || manualDestination} onClear={handleClear} onGo={() => canCalculate && onCalculate(startCoords, destCoords)} /></div></section>
  );
}
