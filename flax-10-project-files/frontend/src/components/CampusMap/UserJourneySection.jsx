import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import { geocodeAddress } from '../../api/user/userApi';
import styles from './UserJourneySection.module.css';

export function UserJourneySection({
    manualStart,
    setManualStart,
    manualDestination,
    setManualDestination,
    onCalculate,
    onClearAll,
}) {
    const [startCoords, setStartCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

    useEffect(() => {
        async function geocodeStart() {
            if (manualStart && manualStart.trim()) {
                const coords = await geocodeAddress(manualStart);
                setStartCoords(coords);
            } else {
                setStartCoords(null);
            }
        }
        geocodeStart();
    }, [manualStart]);

    useEffect(() => {
        async function geocodeDest() {
            if (manualDestination && manualDestination.trim()) {
                const coords = await geocodeAddress(manualDestination);
                setDestCoords(coords);
            } else {
                setDestCoords(null);
            }
        }
        geocodeDest();
    }, [manualDestination]);

    const handleStartSelect = async (address) => {
        setManualStart(address);
    };

    const handleDestSelect = async (address) => {
        setManualDestination(address);
    };

    const handleGo = () => {
        if (startCoords && destCoords) {
            onCalculate(startCoords, destCoords);
        }
    };

    const handleClear = () => {
        setManualStart("");
        setManualDestination("");
        setStartCoords(null);
        setDestCoords(null);
        if (onClearAll) {
            onClearAll();
        }
    };

    const canCalculate = manualStart.trim() && manualDestination.trim() && startCoords && destCoords;

    return (
        <section className={styles.section}>
            <div className={styles.sectionLabel}>
                <span className={styles.searchIcon}>🔍</span>
                Plan Custom Journey
            </div>

            <div className={styles.manualJourneyInputs}>
                <div className={styles.manualInputGroup}>
                    <label className={styles.manualLabel}>From</label>
                    <LocationAutocomplete 
                        value={manualStart}
                        onChange={handleStartSelect}
                        placeholder="Enter a starting location"
                    />
                </div>

                <div className={styles.manualInputGroup}>
                    <label className={styles.manualLabel}>To</label>
                    <LocationAutocomplete 
                        value={manualDestination}
                        onChange={handleDestSelect}
                        placeholder="Enter a destination"
                    />
                </div>

                <div className={styles.manualButtonGroup}>
                    <button
                        className={styles.goButton}    
                        onClick={handleGo}
                        disabled={!canCalculate}
                    >
                        {canCalculate ? "Calculate Route 🚀": "Enter both locations"}
                    </button>

                    {(manualStart || manualDestination) && (
                        <button
                            className={styles.clearManualButton}
                            onClick={handleClear}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}