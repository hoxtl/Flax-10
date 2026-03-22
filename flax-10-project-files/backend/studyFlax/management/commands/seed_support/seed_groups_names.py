import re
from datetime import timedelta

PROJECT_DEADLINE_OFFSETS = (2, 5, 7, 10, 12, 15, 17, 19)
URGENT_PROJECT_LIMIT = 3
PROJECT_TYPE_TEMPLATES = {
    "technical": ["prototype review", "sprint presentation", "solution walkthrough"],
    "lab": ["research poster", "findings deck", "methods showcase"],
    "analysis": ["case study workshop", "insight presentation", "research summary"],
    "default": ["group presentation", "research workshop", "strategy deck"],
}
GENERIC_SUBJECT_WORDS = {
    "analysis", "assignment", "case", "coursework", "deck", "discussion", "essay",
    "final", "findings", "group", "lab", "methods", "oral", "paper", "poster",
    "presentation", "problem", "project", "report", "research", "review", "seminar",
    "session", "sheet", "showcase", "study", "submission", "summary", "workshop",
    "writeup",
}


def _get_deadline_offset(index):
    return PROJECT_DEADLINE_OFFSETS[index % len(PROJECT_DEADLINE_OFFSETS)]


def _project_target_count(module):
    return 1 + (sum(ord(ch) for ch in module.module_code) % 2)


def _module_project_family(module):
    prefix = module.module_code[:2]
    if prefix in {"CS", "AI", "EE", "GN", "CM"}:
        return "technical"
    if prefix in {"PH", "CH", "LS", "NS", "MD", "NU", "MW", "DE"}:
        return "lab"
    if prefix in {"MA", "AF", "EC"}:
        return "analysis"
    return "default"


def _normalise_spacing(value):
    return re.sub(r"\s+", " ", str(value or "").strip(" :-")).strip()


def _strip_prefix_if_match(clean, prefix):
    if clean.lower().startswith(prefix.lower()):
        return _normalise_spacing(clean[len(prefix):])
    return clean


def _strip_module_prefix(module, label):
    clean = _normalise_spacing(label)
    if not clean:
        return ""
    code = _normalise_spacing(module.module_code)
    name = _normalise_spacing(module.module_name)
    for prefix in [p for p in (f"{code}:", f"{name}:", code, name) if p]:
        clean = _strip_prefix_if_match(clean, prefix)
    return clean


def _module_topic_label(module):
    words = [w for w in re.split(r"[^A-Za-z0-9]+", module.module_name or "") if w]
    ignored = {"and", "the", "of", "to", "for", "advanced", "topics", "introduction", "environment"}
    topic_words = [w for w in words if w.lower() not in ignored]
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
    tokens = [t for t in re.split(r"[^A-Za-z0-9]+", _normalise_spacing(subject).lower()) if t]
    if not tokens:
        return True
    return all(t.isdigit() or t in GENERIC_SUBJECT_WORDS for t in tokens)


def _build_topic_project_name(module, index):
    topic = _module_topic_label(module)
    family = _module_project_family(module)
    templates = PROJECT_TYPE_TEMPLATES.get(family, PROJECT_TYPE_TEMPLATES["default"])
    return _title_case(f"{topic} {templates[index % len(templates)]}")


def _subject_for_replacement(prefix, module):
    if prefix and not _looks_generic_subject(prefix):
        return prefix
    return _module_topic_label(module)


def _apply_replacement(clean, lower, module, needle, replacement):
    if needle not in lower:
        return None
    prefix = _normalise_spacing(clean[:lower.index(needle)])
    subject = _subject_for_replacement(prefix, module)
    return _title_case(f"{subject} {replacement}")


_REPLACEMENTS = (
    ("essay", "discussion deck"),
    ("case study", "case study workshop"),
    ("presentation", "presentation"),
    ("report", "report review"),
    ("problem sheet", "problem clinic"),
    ("poster", "poster session"),
    ("coursework", "group coursework"),
)


def _replacement_name(clean, lower, module):
    results = [_apply_replacement(clean, lower, module, n, r) for n, r in _REPLACEMENTS]
    return next((r for r in results if r is not None), None)


def _derive_collaborative_deadline_name(module, label, index):
    clean = _strip_module_prefix(module, label)
    if not clean or _looks_generic_project_title(clean):
        return _build_topic_project_name(module, index)
    result = _replacement_name(clean, clean.lower(), module)
    if result is not None:
        return result
    if len(clean.split()) <= 2:
        subject = clean if not _looks_generic_subject(clean) else _module_topic_label(module)
        return _title_case(f"{subject} workshop")
    return _title_case(clean)


def _project_fallback_names(module):
    return [_build_topic_project_name(module, i) for i in range(_project_target_count(module) + 1)]


def _deadline_priority(deadline, now):
    days = (deadline.start_due_date.date() - now.date()).days
    return 0 if 1 <= days <= 20 else 1


def _is_valid_deadline_type(deadline):
    return deadline.deadline_type in {"coursework", "presentation"}


def _build_deadline_candidate(deadline, module, now, count):
    name = _derive_collaborative_deadline_name(module, deadline.title, count)
    return (_deadline_priority(deadline, now), deadline, name)


def _project_deadline_candidates(module, now):
    raw = [
        _build_deadline_candidate(d, module, now, i)
        for i, d in enumerate(module.deadlines.order_by("start_due_date"))
        if _is_valid_deadline_type(d)
    ]
    return [(d, name) for _, d, name in sorted(raw, key=lambda item: (item[0], item[1].start_due_date))]


def _next_fallback_name(specs, fallback_names, fallback_index):
    name = fallback_names[fallback_index % len(fallback_names)]
    if any(spec["name"] == name for spec in specs):
        return None, fallback_index + 1
    return name, fallback_index + 1


def _append_fallback_name(specs, module, fallback_names, fallback_index):
    name, next_index = _next_fallback_name(specs, fallback_names, fallback_index)
    if name:
        specs.append({"name": name, "module": module, "source_deadline": None})
    return next_index


def _fill_specs_from_fallbacks(specs, target_count, module, fallback_names):
    fallback_index = 0
    while len(specs) < target_count:
        fallback_index = _append_fallback_name(specs, module, fallback_names, fallback_index)


def _build_module_project_specs(module, now):
    specs = []
    target_count = _project_target_count(module)
    for deadline, name in _project_deadline_candidates(module, now)[:target_count]:
        specs.append({"name": name, "module": module, "source_deadline": deadline})
    _fill_specs_from_fallbacks(specs, target_count, module, _project_fallback_names(module))
    return specs


def _deadline_is_urgent(days, index):
    return days <= 7 and index >= URGENT_PROJECT_LIMIT


def _resolve_project_deadline(now, index, source_deadline=None):
    fallback_due = (now + timedelta(days=_get_deadline_offset(index))).replace(hour=23, minute=59, second=0, microsecond=0)
    if not source_deadline:
        return fallback_due
    days = (source_deadline.start_due_date.date() - now.date()).days
    if 1 <= days <= 20 and not _deadline_is_urgent(days, index):
        return source_deadline.start_due_date
    return fallback_due


def _build_project_defaults(owner, module, now, index, source_deadline=None):
    due = _resolve_project_deadline(now, index, source_deadline)
    course_code = module.module_code if module else ""
    return {'owner': owner, 'course_code': course_code, 'deadline': due}


def _next_unique_candidate(spec, index, used_names, variant_index, max_template_variants):
    if variant_index > max_template_variants:
        base = _build_topic_project_name(spec["module"], index)
        return f"{base} {variant_index - max_template_variants}"
    return _build_topic_project_name(spec["module"], index + variant_index)


def _resolve_unique_name(spec, index, used_names):
    max_template_variants = 30
    candidate = _build_topic_project_name(spec["module"], index)
    variant_index = 1
    while candidate in used_names:
        candidate = _next_unique_candidate(spec, index, used_names, variant_index, max_template_variants)
        variant_index += 1
    return candidate


def _uniquify_spec(spec, index, counts, used_names):
    original_name = spec["name"]
    if counts.get(original_name, 0) <= 1 and original_name not in used_names:
        used_names.add(original_name)
        return
    candidate = _resolve_unique_name(spec, index, used_names)
    spec["name"] = candidate
    used_names.add(candidate)


def _uniquify_project_spec_names(specs):
    counts = {}
    used_names = set()
    for spec in specs:
        counts[spec["name"]] = counts.get(spec["name"], 0) + 1
    for index, spec in enumerate(specs):
        _uniquify_spec(spec, index, counts, used_names)
    return specs


def _build_project_specs(showcase_student, student_modules, seed_modules, now):
    specs = []
    for module in seed_modules:
        specs.extend(_build_module_project_specs(module, now))
    return _uniquify_project_spec_names(specs)
