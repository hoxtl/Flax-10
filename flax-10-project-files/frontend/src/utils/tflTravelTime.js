/*
 * Calculates TfL travel time from a home address to a module location.
 */

import { tflService } from '../api/tflApi';

async function geocodeModuleLocation(moduleLocation) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(moduleLocation)}.json?access_token=${mapboxToken}&country=GB&limit=1`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.features?.length) return null;
  const [lng, lat] = data.features[0].center;
  return { lat, lng };
}

async function computeJourney(homeAddress, dest) {
  const journey = await tflService.journeyPlanner(homeAddress.home_latitude, homeAddress.home_longitude, dest.lat, dest.lng);
  if (!journey) return null;
  return { duration: journey.duration, legs: journey.legs };
}

export async function getTravelTimeModule(homeAddress, moduleLocation) {
  if (!homeAddress?.home_latitude || !homeAddress?.home_longitude || !moduleLocation) return null;
  try {
    const dest = await geocodeModuleLocation(moduleLocation);
    return dest ? await computeJourney(homeAddress, dest) : null;
  } catch {}
}
