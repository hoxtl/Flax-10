import requests
import os


class GeocodingService:
    """
    Utility class for geocoding addresses using Mapbox API
    """

    MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"
    @staticmethod
    def geocode_location(loc_string):
        """
        Geocode a location string to its latitude/longitude coordinates
        """
        if not loc_string or not loc_string.strip():
            return {
                'success': False,
                'latitude': None,
                'longitude': None,
                'formatted_address': None,
            }
        
        mapbox_token = os.getenv('VITE_MAPBOX_TOKEN')
        if not mapbox_token:
            print("ERROR: Mapbox token not found in the environment...")
            return {
                'success': False,
                'latitude': None,
                'longitude': None,
                'formatted_address': None,
            }
        try:
            encoded_loc = requests.utils.quote(loc_string)
            url = f"{GeocodingService.MAPBOX_GEOCODING_URL}/{encoded_loc}.json"
            params = {
                'access_token': mapbox_token,
                'limit': 1,
                'country': 'GB',
            }
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()