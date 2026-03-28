/*
 * Custom journey planner section for the campus map.
 */

import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../../calendar/event_modal/components/LocationAutoComplete";
import Tooltip from "../../common/tooltip/Tooltip";
import { geocodeAddress } from "../../../api/geocodeApi";
import styles from "../styles/UserJourneySection.module.css";

function handleGeocode(trimmedValue, setCoords, active) {
  const parsedCoords = parseCoordinateInput(trimmedValue);
  if (parsedCoords) {
    setCoords(parsedCoords);
    return;
  }
  geocodeAddress(trimmedValue).then((coords) => active.current && setCoords(coords));
}

function useGeocodedLocation(value, setCoords) {
  useEffect(() => {
    const active = { current: true };
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setCoords(null);
      return undefined;
    }
    handleGeocode(trimmedValue, setCoords, active);
    return () => { active.current = false; };
  }, [setCoords, value]);
}

function parseCoordinateInput(value) {
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
}

function GeoInlineBtn({ ariaLabel, locating, onGeolocate, tooltip }) {
  return (
    <Tooltip content={tooltip} position="top">
      <button className={styles.geoInlineBtn} onClick={onGeolocate} disabled={locating} type="button" aria-label={ariaLabel}>
        {locating ? "⏳" : "📍"}
      </button>
    </Tooltip>
  );
}

function JourneyField({ ariaLabel, label, locating, onChange, onGeolocate, placeholder, tooltip, value }) {
  return (
    <div className={styles.manualInputGroup}>
      <label className={styles.manualLabel}>{label}</label>
      <div className={styles.locationInputWrapper}>
        <LocationAutocomplete value={value} onChange={onChange} placeholder={placeholder} />
        {onGeolocate ? <GeoInlineBtn ariaLabel={ariaLabel} locating={locating} onGeolocate={onGeolocate} tooltip={tooltip} /> : null}
      </div>
    </div>
  );
}

function JourneyActions({ canCalculate, hasValue, onCalculate, onClear }) {
  if (!hasValue && !canCalculate) return null;
  return (
    <div className={styles.manualButtonGroup}>
      <button type="button" className={styles.goButton} onClick={onCalculate} disabled={!canCalculate}>
        Calculate route
      </button>
      <button type="button" className={styles.clearManualButton} onClick={onClear}>Clear</button>
    </div>
  );
}

function SectionLabel() {
  return (
    <div className={styles.sectionLabel}>
      <span className={styles.searchIcon}>🔍</span>
      Plan Custom Journey
    </div>
  );
}

function JourneyInputs({ destCoords, locating, manualDestination, manualStart, onCalculate, onClearAll, onGeolocateDestination, onGeolocateStart, setDestCoords, setManualDestination, setManualStart, setStartCoords, startCoords }) {
  const canCalculate = Boolean(startCoords && destCoords);
  const handleClear = () => { setManualStart(""); setManualDestination(""); setStartCoords(null); setDestCoords(null); onClearAll?.(); };
  const handleCalculate = () => onCalculate?.(startCoords, destCoords);
  return (
    <div className={styles.manualJourneyInputs}>
      <JourneyField label="From" value={manualStart} onChange={setManualStart} onGeolocate={onGeolocateStart} locating={locating} placeholder="Enter a starting location" ariaLabel="Set start to current location" tooltip="Use current location for start" />
      <JourneyField label="To" value={manualDestination} onChange={setManualDestination} onGeolocate={onGeolocateDestination} locating={locating} placeholder="Enter a destination" ariaLabel="Set destination to current location" tooltip="Use current location for destination" />
      <JourneyActions canCalculate={canCalculate} hasValue={manualStart || manualDestination} onCalculate={canCalculate ? handleCalculate : undefined} onClear={handleClear} />
    </div>
  );
}

/** Section component for planning a custom journey between two locations on campus. */

export function UserJourneySection(props) {
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  useGeocodedLocation(props.manualStart, setStartCoords);
  useGeocodedLocation(props.manualDestination, setDestCoords);
  return (
    <section className={styles.section}>
      <SectionLabel />
      <JourneyInputs {...props} startCoords={startCoords} destCoords={destCoords} setStartCoords={setStartCoords} setDestCoords={setDestCoords} />
    </section>
  );
}
