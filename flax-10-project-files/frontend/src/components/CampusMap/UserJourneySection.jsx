/**
 * Custom journey planner section.
 */

import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import Tooltip from "../Common/Tooltip/Tooltip";
import { geocodeAddress } from "../../api/geocodeApi";
import styles from "./UserJourneySection.module.css";

function useGeocodedLocation(value, setCoords) {
  useEffect(() => {
    let active = true;
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setCoords(null);
      return undefined;
    }
    const parsedCoords = parseCoordinateInput(trimmedValue);
    if (parsedCoords) {
      setCoords(parsedCoords);
      return undefined;
    }
    geocodeAddress(trimmedValue).then((coords) => active && setCoords(coords));
    return () => {
      active = false;
    };
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

function FromField({ value, onChange, onGeolocate, locating }) {
  return (
    <div className={styles.manualInputGroup}>
      <label className={styles.manualLabel}>From</label>
      <div className={styles.locationInputWrapper}>
        <LocationAutocomplete value={value} onChange={onChange} placeholder="Enter a starting location" />
        <GeoInlineBtn
          ariaLabel="Set start to current location"
          locating={locating}
          onGeolocate={onGeolocate}
          tooltip="Use current location for start"
        />
      </div>
    </div>
  );
}

function JourneyField({ label, locating, onChange, onGeolocate, placeholder, value }) {
  return (
    <div className={styles.manualInputGroup}>
      <label className={styles.manualLabel}>{label}</label>
      <div className={styles.locationInputWrapper}>
        <LocationAutocomplete value={value} onChange={onChange} placeholder={placeholder} />
        {onGeolocate ? (
          <GeoInlineBtn
            ariaLabel="Set destination to current location"
            locating={locating}
            onGeolocate={onGeolocate}
            tooltip="Use current location for destination"
          />
        ) : null}
      </div>
    </div>
  );
}

function JourneyActions({ canCalculate, hasValue, onClear, onGo }) {
  return (
    <div className={styles.manualButtonGroup}><button className={styles.goButton} onClick={onGo} disabled={!canCalculate}>{canCalculate ? "Calculate Route 🚀" : "Enter both locations"}</button>{hasValue && <button className={styles.clearManualButton} onClick={onClear}>Clear</button>}</div>
  );
}

export function UserJourneySection({
  manualStart,
  setManualStart,
  manualDestination,
  setManualDestination,
  onCalculate,
  onClearAll,
  onGeolocateStart,
  onGeolocateDestination,
  locating,
}) {
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const canCalculate = manualStart.trim() && manualDestination.trim() && startCoords && destCoords;

  useGeocodedLocation(manualStart, setStartCoords);
  useGeocodedLocation(manualDestination, setDestCoords);

  const handleClear = () => {
    setManualStart("");
    setManualDestination("");
    setStartCoords(null);
    setDestCoords(null);
    onClearAll?.();
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.searchIcon}>🔍</span>
        Plan Custom Journey
      </div>
      <div className={styles.manualJourneyInputs}>
        <FromField
          value={manualStart}
          onChange={setManualStart}
          onGeolocate={onGeolocateStart}
          locating={locating}
        />
        <JourneyField
          label="To"
          value={manualDestination}
          onChange={setManualDestination}
          onGeolocate={onGeolocateDestination}
          locating={locating}
          placeholder="Enter a destination"
        />
        <JourneyActions
          canCalculate={canCalculate}
          hasValue={manualStart || manualDestination}
          onClear={handleClear}
          onGo={() => canCalculate && onCalculate(startCoords, destCoords)}
        />
      </div>
    </section>
  );
}
