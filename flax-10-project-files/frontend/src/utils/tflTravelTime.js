import { tflService } from '../api/tflService';

/**
 * Get travel time via TfL from home to module location
 */
export async function getTravelTimeModule(homeAddress, moduleLocation) {
    if (!homeAddress?.home_latitude || !homeAddress?.home_longitude || !moduleLocation) {
        return null;
    }

    try {
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
        const encodedLocation = encodeURIComponent(moduleLocation);
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&country=GB&limit=1`

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.features || geocodeData.features.length === 0) {
            return null;
        }

        const [moduleLng, moduleLat] = geocodeData.features[0].center;

        const journey = await tflService.journeyPlanner(
            homeAddress.home_latitude,
            homeAddress.home_longitude,
            moduleLat,
            moduleLng
        );

        if (!journey) {
            return null;
        }

        return {
            duration: journey.duration,
            legs: journey.legs
        };
    } catch (error) {
        console.error('Tfl Home to Module calculation error: ', error);
    }
}