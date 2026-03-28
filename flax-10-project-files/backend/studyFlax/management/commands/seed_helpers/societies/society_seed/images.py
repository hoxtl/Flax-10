"""
Image seeding for society records.
"""

from studyFlax.models import Society, SocietyImage


def _set_cover_image(society):
    if not society.image:
        return
    SocietyImage.objects.filter(society=society, is_cover=True).delete()
    SocietyImage.objects.create(society=society, is_cover=True, url=society.image)

def create_society_images(stdout):
    """Create cover images for seeded societies."""
    del stdout
    for society in Society.objects.all():
        _set_cover_image(society)

