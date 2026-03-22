/*
 * Mapbox geocoding API client — forward and reverse geocoding.
 */

function getMapboxToken() {
  return import.meta.env.VITE_MAPBOX_TOKEN;
}

function extractPlaceName(data) {
  if (!data.features?.length) return null;
  return data.features[0].place_name;
}

export async function geocodeAddress(address) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${getMapboxToken()}&limit=1&country=GB`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('User home geocoding has failed');
  const data = await response.json();
  if (!data.features?.length) return null;
  const [lng, lat] = data.features[0].center;
  return { latitude: lat, longitude: lng };
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${getMapboxToken()}&types=address,poi,place`;
    return extractPlaceName(await (await fetch(url)).json());
  } catch (error) {
    console.error('Reverse geocoding error: ', error);
    return null;
  }
}
