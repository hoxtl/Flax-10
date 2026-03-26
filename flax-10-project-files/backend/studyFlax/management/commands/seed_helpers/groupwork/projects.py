"""
Project name derivation and project creation helpers for group seeding.
"""

import re
from datetime import timedelta

from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership

PROJECT_DEADLINE_OFFSETS = (2, 5, 7, 10, 12, 15, 17, 19)
URGENT_PROJECT_LIMIT = 3
GENERIC_SUBJECT_WORDS = {
    "analysis", "assignment", "case", "coursework", "deck", "discussion", "essay",
    "final", "findings", "group", "lab", "methods", "oral", "paper", "poster",
    "presentation", "problem", "project", "report", "research", "review", "seminar",
    "session", "sheet", "showcase", "study", "submission", "summary", "workshop",
    "writeup",
}
PROJECT_TYPE_TEMPLATES = {
    "technical": ["prototype review", "sprint presentation", "solution walkthrough"],
    "lab": ["research poster", "findings deck", "methods showcase"],
    "analysis": ["case study workshop", "insight presentation", "research summary"],
    "default": ["group presentation", "research workshop", "strategy deck"],
}
ZERO_PROGRESS_PROJECT_COUNT = 0

KEYWORD_REPLACEMENTS = (
    ("essay", "discussion deck"),
    ("case study", "case study workshop"),
    ("presentation", "presentation"),
    ("report", "report review"),
    ("problem sheet", "problem clinic"),
    ("poster", "poster session"),
    ("coursework", "group coursework"),
)


def _normalise_spacing(value):
    return re.sub(r"\s+", " ", str(value or "").strip(" :-")).strip()

def _strip_one_prefix(clean, lowered, prefix):
    """Remove a single prefix from clean if it starts with it. Returns (new_clean, new_lowered)."""

    prefix_lower = prefix.lower()
    if not lowered.startswith(prefix_lower):
        return clean, lowered
    new_clean = _normalise_spacing(clean[len(prefix):])
    return new_clean, new_clean.lower()

def _strip_module_prefix(module, label):
    clean = _normalise_spacing(label)
    if not clean:
        return ""
    code = _normalise_spacing(module.module_code)
    name = _normalise_spacing(module.module_name)
    prefixes = [p for p in (f"{code}:", f"{name}:", code, name) if p]
    lowered = clean.lower()
    for prefix in prefixes:
        clean, lowered = _strip_one_prefix(clean, lowered, prefix)
    return clean

def _module_topic_label(module):
    words = [word for word in re.split(r"[^A-Za-z0-9]+", module.module_name or "") if word]
    ignored = {"and", "the", "of", "to", "for", "advanced", "topics", "introduction", "environment"}
    topic_words = [word for word in words if word.lower() not in ignored]
    topic = " ".join(topic_words[:2]) if topic_words else module.module_name or module.module_code
    return _normalise_spacing(topic)

def _title_case(value):
    clean = _normalise_spacing(value)
    return clean[:1].upper() + clean[1:] if clean else clean

def _looks_generic_project_title(label):
    normalised = _normalise_spacing(label).lower()
    if not normalised:
        return True
    generic_patterns = (
        r"^(coursework|assignment|presentation|essay|report|poster|seminar|project)\s*\d*$",
        r"^(group\s+)?coursework\s*\d*$",
        r"^problem\s+sheet\s*\d*$",
        r"^lab\s+report(\s+\d+)?$",
        r"^report\s+review$",
        r"^findings\s+deck$",
        r"^research\s+poster$",
        r"^case\s+report\s+review$",
    )
    return any(re.fullmatch(pattern, normalised) for pattern in generic_patterns)

def _looks_generic_subject(subject):
    tokens = [token for token in re.split(r"[^A-Za-z0-9]+", _normalise_spacing(subject).lower()) if token]
    if not tokens:
        return True
    return all(token.isdigit() or token in GENERIC_SUBJECT_WORDS for token in tokens)

def _build_topic_project_name(module, index):
    topic = _module_topic_label(module)
    family = _module_project_family(module)
    templates = PROJECT_TYPE_TEMPLATES.get(family, PROJECT_TYPE_TEMPLATES["default"])
    template = templates[index % len(templates)]
    return _title_case(f"{topic} {template}")

def _match_keyword(needle, replacement, clean, lower, module):
    """Return a name if needle is found in lower, else None."""

    if needle not in lower:
        return None
    prefix = _normalise_spacing(clean[:lower.index(needle)])
    subject = prefix if prefix and not _looks_generic_subject(prefix) else _module_topic_label(module)
    return _title_case(f"{subject} {replacement}")

def _apply_keyword_replacement(clean, lower, module):
    """Return a name using keyword substitution, or None if no keyword matches."""

    results = [_match_keyword(n, r, clean, lower, module) for n, r in KEYWORD_REPLACEMENTS]
    return next((r for r in results if r is not None), None)

def _build_short_label_name(clean, module):
    """Return a name for a short (≤2 word) label."""

    subject = clean if not _looks_generic_subject(clean) else _module_topic_label(module)
    return _title_case(f"{subject} workshop")

def _derive_collaborative_deadline_name(module, label, index):
    clean = _strip_module_prefix(module, label)
    if not clean or _looks_generic_project_title(clean):
        return _build_topic_project_name(module, index)
    lower = clean.lower()
    keyword_name = _apply_keyword_replacement(clean, lower, module)
    if keyword_name:
        return keyword_name
    if len(clean.split()) <= 2:
        return _build_short_label_name(clean, module)
    return _title_case(clean)

def _project_fallback_names(module):
    return [_build_topic_project_name(module, index) for index in range(_project_target_count(module) + 1)]

def _build_deadline_candidate(deadline, module, now, index):
    """Return a (sort_key, deadline, name) tuple for a single deadline."""

    days = (deadline.start_due_date.date() - now.date()).days
    name = _derive_collaborative_deadline_name(module, deadline.title, index)
    return (0 if 1 <= days <= 20 else 1, deadline, name)

def _include_deadline_candidate(deadline):
    return deadline.deadline_type in {"coursework", "presentation"}

def _project_deadline_candidates(module, now):
    candidates = [
        _build_deadline_candidate(deadline, module, now, idx)
        for idx, deadline in enumerate(module.deadlines.order_by("start_due_date"))
        if _include_deadline_candidate(deadline)
    ]
    return [(deadline, name) for _, deadline, name in sorted(candidates, key=lambda item: (item[0], item[1].start_due_date))]

def _append_fallback_spec(specs, module, fallback_names, fallback_index):
    """Append one fallback spec if its name is not already used. Returns next fallback_index."""

    fallback_name = fallback_names[fallback_index % len(fallback_names)]
    if not any(spec["name"] == fallback_name for spec in specs):
        specs.append({"name": fallback_name, "module": module, "source_deadline": None})
    return fallback_index + 1

def _build_module_project_specs(module, now):
    specs = []
    target_count = _project_target_count(module)
    for deadline, name in _project_deadline_candidates(module, now)[:target_count]:
        specs.append({"name": name, "module": module, "source_deadline": deadline})
    fallback_names = _project_fallback_names(module)
    fallback_index = 0
    while len(specs) < target_count:
        fallback_index = _append_fallback_spec(specs, module, fallback_names, fallback_index)
    return specs

def _is_valid_source_deadline(source_deadline, now, index):
    """Return True if the source deadline falls in a usable window for this index."""

    if not source_deadline:
        return False
    days = (source_deadline.start_due_date.date() - now.date()).days
    if not (1 <= days <= 20):
        return False
    return not (days <= 7 and index >= URGENT_PROJECT_LIMIT)

def _deadline_from_source(source_deadline, now, index):
    """Return the deadline date from a source deadline offset."""

    del now, index
    return source_deadline.start_due_date

def _resolve_project_deadline(now, index, source_deadline=None):
    from datetime import timedelta
    fallback_due = (now + timedelta(days=_get_deadline_offset(index))).replace(hour=23, minute=59, second=0, microsecond=0)
    if _is_valid_source_deadline(source_deadline, now, index):
        return _deadline_from_source(source_deadline, now, index)
    return fallback_due

def _project_target_count(module):
    return 1

def _module_project_family(module):
    prefix = module.module_code[:2]
    if prefix in {"CS", "AI", "EE", "GN", "CM"}:
        return "technical"
    if prefix in {"PH", "CH", "LS", "NS", "MD", "NU", "MW", "DE"}:
        return "lab"
    if prefix in {"MA", "AF", "EC"}:
        return "analysis"
    return "default"

def _build_project_defaults(owner, module, now, index, source_deadline=None):
    due = _resolve_project_deadline(now, index, source_deadline)
    course_code = module.module_code if module else ""
    return {'owner': owner, 'course_code': course_code, 'deadline': due}

def _sync_project_owner_membership(project, owner):
    GroupMembership.objects.filter(project=project, role='owner').exclude(user=owner).update(role='member')
    GroupMembership.objects.update_or_create(project=project, user=owner, defaults={'role': 'owner'})

def _build_project_name(module, label):
    return _normalise_spacing(label)

def _build_project_specs(showcase_student, student_modules, seed_modules, now):
    del showcase_student, student_modules
    specs = []
    for module in seed_modules:
        specs.extend(_build_module_project_specs(module, now))
    return _uniquify_project_spec_names(specs)

def _next_candidate_name(module, index, variant_index, max_variants):
    if variant_index > max_variants:
        base = _build_topic_project_name(module, index)
        return f"{base} {variant_index - max_variants}"
    return _build_topic_project_name(module, index + variant_index)

def _find_unique_project_name(used_names, module, index):
    """Find a project name not in used_names by cycling template variants."""

    max_template_variants = 30
    variant_index = 1
    candidate = _build_topic_project_name(module, index)
    while candidate in used_names:
        candidate = _next_candidate_name(module, index, variant_index, max_template_variants)
        variant_index += 1
    return candidate

def _count_spec_names(specs):
    counts = {}
    for spec in specs:
        counts[spec["name"]] = counts.get(spec["name"], 0) + 1
    return counts

def _uniquify_spec(spec, index, counts, used_names):
    original_name = spec["name"]
    if counts.get(original_name, 0) <= 1 and original_name not in used_names:
        used_names.add(original_name)
        return
    candidate = _find_unique_project_name(used_names, spec["module"], index)
    spec["name"] = candidate
    used_names.add(candidate)

def _uniquify_project_spec_names(specs):
    counts = _count_spec_names(specs)
    used_names = set()
    for index, spec in enumerate(specs):
        _uniquify_spec(spec, index, counts, used_names)
    return specs

def _update_project_fields(project, defaults):
    for field, value in defaults.items():
        setattr(project, field, value)
    project.save(update_fields=list(defaults.keys()))

def _create_single_project(spec, students, now, rng, index, module_students):
    from .membership import _pick_owner_for_module
    module = spec["module"]
    owner = _pick_owner_for_module(module, students, module_students, rng)
    if not owner:
        return
    defaults = _build_project_defaults(owner, module, now, index, source_deadline=spec.get("source_deadline"))
    project, created = GroupProject.objects.get_or_create(name=spec["name"], course_code=defaults["course_code"], defaults=defaults)
    if not created:
        _update_project_fields(project, defaults)
    _sync_project_owner_membership(project, owner)


def _get_deadline_offset(index):
    return PROJECT_DEADLINE_OFFSETS[index % len(PROJECT_DEADLINE_OFFSETS)]
