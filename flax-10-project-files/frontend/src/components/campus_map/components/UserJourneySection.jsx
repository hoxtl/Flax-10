/*
 * Custom journey planner section.
 */

import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../../calendar/event_modal/components/LocationAutoComplete";
import Tooltip from "../../common/Tooltip/Tooltip";
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

function JourneyActions({ hasValue, onClear }) {
  if (!hasValue) return null;
  return (
    <div className={styles.manualButtonGroup}>
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

function JourneyInputs({ props, startCoords, destCoords, setStartCoords, setDestCoords }) {
  const { manualStart, setManualStart, manualDestination, setManualDestination } = props;
  const { onClearAll, onGeolocateStart, onGeolocateDestination, locating } = props;
  const handleClear = () => {
    setManualStart("");
    setManualDestination("");
    setStartCoords(null);
    setDestCoords(null);
    onClearAll?.();
  };
  return (
    <div className={styles.manualJourneyInputs}>
      <FromField value={manualStart} onChange={setManualStart} onGeolocate={onGeolocateStart} locating={locating} />
      <JourneyField label="To" value={manualDestination} onChange={setManualDestination} onGeolocate={onGeolocateDestination} locating={locating} placeholder="Enter a destination" />
      <JourneyActions hasValue={manualStart || manualDestination} onClear={handleClear} />
    </div>
  );
}

export function UserJourneySection(props) {
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  useGeocodedLocation(props.manualStart, setStartCoords);
  useGeocodedLocation(props.manualDestination, setDestCoords);
  return (
    <section className={styles.section}>
      <SectionLabel />
      <JourneyInputs props={props} startCoords={startCoords} destCoords={destCoords} setStartCoords={setStartCoords} setDestCoords={setDestCoords} />
    </section>
  );
}
