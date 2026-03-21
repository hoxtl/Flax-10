import { useEffect, useState } from "react";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import { geocodeAddress } from '../../api/userApi';
import styles from './UserJourneySection.module.css';

export function UserJourneySection({
    manualStart,
    setManualStart,
    manualDestination,
    setManualDestination,
    onCalculate,
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

    const handleStartSelect = async (address) => {
        setManualStart(address);
        const coords = await geocodeAddress(address);
        setStartCoords(coords);
    };

    const handleDestSelect = async (address) => {
        setManualDestination(address);
        const coords = await geocodeAddress(address);
        setDestCoords(coords);
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