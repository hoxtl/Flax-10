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