import { useState } from "react";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import { geocodeAddress } from '../../api/userService';

export function ManualJourneySection({
    manualStart,
    setManualStart,
    manualDestination,
    setManualDestination,
    onCalculate,
    styles
}) {
    const [startCoords, setStartCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

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
        </section>
    )
}