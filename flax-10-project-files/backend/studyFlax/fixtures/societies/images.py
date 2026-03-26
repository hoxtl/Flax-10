"""
Image mappings for seeded society records.
"""

import random

from .catalogue import CATEGORY_MAPPING

CATEGORY_IMAGES = {
    "sports": ["sports1.jpg", "sports2.jpg"],
    "cultural": ["cultural1.jpg", "cultural2.jpg"],
    "academic": ["academic1.jpg", "academic2.jpg", "professional1.jpg", "professional2.jpg"],
    "arts": ["arts1.jpg", "arts2.jpg", "music1.jpg", "music2.jpg", "dance1.jpg", "dance2.jpg"],
    "social": ["social1.jpg", "social2.jpg", "gaming1.jpg", "gaming2.jpg"],
    "religious": ["religious1.jpg", "religious2.jpg"],
    "volunteering": ["volunteering1.jpg", "volunteering2.jpg"],
    "media": ["media1.jpg", "media2.jpg"],
}


def get_random_category_image(category):
    """Pick one seeded image for a society category."""

    mapped = CATEGORY_MAPPING.get(category, category)
    images = CATEGORY_IMAGES.get(mapped, CATEGORY_IMAGES["social"])
    original_prefix = category if category != mapped else None
    original_images = [image for image in images if image.startswith(original_prefix)] if original_prefix else []
    return random.choice(original_images or images)


__all__ = ["CATEGORY_IMAGES", "get_random_category_image"]

