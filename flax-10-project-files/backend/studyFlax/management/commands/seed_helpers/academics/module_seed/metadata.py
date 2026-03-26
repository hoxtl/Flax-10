"""
Module metadata builders for seeded module records.
"""

from collections import defaultdict

from studyFlax.fixtures.planning.data_fixtures import course_to_module_prefixes
from studyFlax.fixtures.catalogue.module_fixtures import module_fixtures
from studyFlax.fixtures.users.user_fixtures import module_prefix_to_department


def _register_course_prefixes(mapping, course, prefixes):
    for prefix in prefixes:
        mapping.setdefault(prefix, course)

def _prefix_to_course_map():
    mapping = {}
    for course, prefixes in course_to_module_prefixes.items():
        _register_course_prefixes(mapping, course, prefixes)
    return mapping
PREFIX_TO_COURSE = _prefix_to_course_map()
EXTRA_MODULE_BASE_NUMBERS = [4606, 4707, 4808]
EXTRA_MODULE_NAMES = ["Advanced Topics", "Applied Practice", "Research Project"]

def get_module_prefix(module_code):
    """Return the alphabetical prefix from a seeded module code."""
    end = next((index for index, char in enumerate(module_code) if not char.isalpha()), len(module_code))
    return module_code[:end] or module_code[:2]

def build_module_metadata(module_code):
    """Build the department and course metadata for one module code."""
    prefix = get_module_prefix(module_code)
    department = module_prefix_to_department.get(prefix, "")
    course = PREFIX_TO_COURSE.get(prefix, "")
    return department, course

def _build_single_extra(prefix, base_number, extra_name, existing_codes):
    code = f"{prefix}{base_number}"
    if code in existing_codes:

        return None
    name = f"{extra_name} in {prefix}"
    description = f"Extended {prefix} module focused on advanced concepts, applied methods, and real-world case work."
    return code, name, description

def _candidate_extra_entries(prefix, existing_codes, target_count):
    limit = min(target_count, len(EXTRA_MODULE_BASE_NUMBERS))

    return [
        _build_single_extra(prefix, EXTRA_MODULE_BASE_NUMBERS[index], EXTRA_MODULE_NAMES[index], existing_codes)
        for index in range(limit)
    ]

def _build_extra_module_entries(prefix, existing_codes, target_count):

    return [entry for entry in _candidate_extra_entries(prefix, existing_codes, target_count) if entry is not None]

def _expand_prefix_group(prefix, entries, target_count):
    if len(entries) >= target_count:
        return list(entries)
    existing_codes = {code for code, _, _ in entries}
    needed = target_count - len(entries)
    return list(entries) + _build_extra_module_entries(prefix, existing_codes, needed)

def build_modules_with_target_per_prefix(fixtures, target_count=8):
    """Expand seeded module data so each prefix reaches the target count."""
    grouped = defaultdict(list)
    for code, name, description in fixtures:
        grouped[get_module_prefix(code)].append((code, name, description))
    expanded = []
    for prefix, entries in grouped.items():
        expanded.extend(_expand_prefix_group(prefix, entries, target_count))
    return expanded

def build_module_specs(target_count=5):
    """Build the full module spec tuples used during module seeding."""
    entries = build_modules_with_target_per_prefix(module_fixtures, target_count=target_count)
    return [(code, name, description, *build_module_metadata(code)) for code, name, description in entries]

def group_specs_by_department(specs):
    """Group seeded module specs by department for teacher allocation."""
    grouped = defaultdict(list)
    for spec in specs:
        grouped[spec[3]].append(spec)
    return grouped
