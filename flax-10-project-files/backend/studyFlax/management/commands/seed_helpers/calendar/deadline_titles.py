"""
Builds module-specific deadline titles for seeded deadlines.
"""

DEADLINE_TITLE_SUFFIXES = (
    ("essay", "Essay"),
    ("report", "Report"),
    ("quiz", "Quiz"),
    ("presentation", "Presentation"),
    ("assignment", "Assignment"),
    ("portfolio", "Portfolio"),
    ("brief", "Brief"),
    ("proposal", "Proposal"),
    ("case study", "Case Study"),
    ("review", "Review"),
    ("exam", "Exam"),
    ("test", "Test"),
)

DEADLINE_TYPE_LABELS = {
    "coursework": "Coursework",
    "quiz": "Quiz",
    "presentation": "Presentation",
    "exam": "Exam",
}


def _module_label(module):
    """Return the display label for a module."""

    return (getattr(module, "module_name", None) or getattr(module, "module_code", "")).strip()


def _matching_deadline_suffix(title):
    """Return a normalised label for a shared deadline title."""

    lower = str(title or "").strip().lower()
    return next((label for suffix, label in DEADLINE_TITLE_SUFFIXES if lower.endswith(suffix)), None)


def _deadline_type_label(deadline_type):
    """Return the fallback label for a deadline type."""

    return DEADLINE_TYPE_LABELS.get(deadline_type)


def build_module_deadline_title(module, deadline_type, title):
    """Return a module-specific title for a shared deadline template."""

    module_label = _module_label(module)
    normalised = str(title or "").strip()
    suffix_label = _matching_deadline_suffix(normalised)
    if suffix_label:
        return f"{module_label} {suffix_label}"
    deadline_label = _deadline_type_label(deadline_type)
    if deadline_label:
        return f"{module_label} {deadline_label}"
    return f"{module_label} {normalised}".strip()
