import requests
import os


class GeocodingService:
    """
    Utility class for geocoding addresses using Mapbox API
    """

    MAPBOX_GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"