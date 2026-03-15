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
}