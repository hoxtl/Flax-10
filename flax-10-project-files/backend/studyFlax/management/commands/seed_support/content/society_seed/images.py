"""
Image seeding for society records.
"""

from studyFlax.models import Society, SocietyImage


def _set_cover_image(society):
    if not society.image:
        return
    SocietyImage.objects.filter(society=society, is_cover=True).delete()
    SocietyImage.objects.create(society=society, is_cover=True, url=society.image)


def _add_extra_images(society):
    current_count = society.images.count()
    for index in range(5 - current_count):
        SocietyImage.objects.create(
            society=society,
            url=f"https://picsum.photos/seed/{society.name}{index}/800/600",
            is_cover=False,
        )


def create_society_images(stdout):
    """Create cover and gallery images for seeded societies."""

    del stdout
    for society in Society.objects.all():
        _set_cover_image(society)
        _add_extra_images(society)

