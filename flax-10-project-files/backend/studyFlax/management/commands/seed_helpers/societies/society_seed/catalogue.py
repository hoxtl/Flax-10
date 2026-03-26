"""
Society record builders for seed commands.
"""

from studyFlax.fixtures.societies.society_fixtures import build_society_seed_data
from studyFlax.models import Society, SocietyTag


PENDING_RATIFICATION_TARGET = 14
APPROVED_SOCIETY_TARGET = 24
PASTEL_TAG_COLORS = [
    "#F4A7B9", "#B8C8F4", "#A8D8B0", "#F9C89A", "#C5B4E3",
    "#96CEFF", "#F7D090", "#B0D9A8", "#F2C6D0", "#9FD3D3",
    "#D4B5C8", "#C8E6C9", "#FFD1A8", "#E1BEE7", "#B3E5FC",
    "#F0F4C3", "#DCEDC8", "#FFDDB3", "#E8EAF6", "#FCE4EC",
    "#C9E4CA", "#FFE4B5", "#D0E8FF", "#FFD6E0", "#D6EAD0",
]


def _society_status_for_index(index, total):
    pending_target = min(PENDING_RATIFICATION_TARGET, max(total // 5, 1))
    approved_target = min(APPROVED_SOCIETY_TARGET, max(total - pending_target, 0))
    if index < pending_target:
        return "pending"
    if index < pending_target + approved_target:
        return "approved"
    return "rejected" if (index - pending_target - approved_target) % 2 == 0 else "none"

def _create_society_from_config(data, index, total):
    status = _society_status_for_index(index, total)
    defaults = {
        "bio": data["bio"],
        "about": data["about"],
        "categories": data.get("categories", []),
        "ratification_status": status,
        "is_ratified": status == "approved",
    }
    if data.get("image"):
        defaults["image"] = data["image"]
    society, _ = Society.objects.update_or_create(name=data["name"], defaults=defaults)
    return society

def _tag_color_for_label(label):
    """Tag colour for label."""
    return PASTEL_TAG_COLORS[sum(ord(char) for char in label) % len(PASTEL_TAG_COLORS)]

def _seed_society_tags(society, tag_labels):
    for label in tag_labels:
        SocietyTag.objects.update_or_create(
            society=society,
            label=label,
            defaults={"color": _tag_color_for_label(label)},
        )

def create_societies(stdout):
    del stdout
    seed_data = build_society_seed_data()
    total = len(seed_data)
    for index, data in enumerate(seed_data):
        society = _create_society_from_config(data, index, total)
        _seed_society_tags(society, data.get("tags", []))

def get_society_seed_lookup():
    """Return the seeded society payloads keyed by society name."""
    return {item["name"]: item for item in build_society_seed_data()}
