"""
Teacher allocation helpers for seeded modules.
"""

from collections import defaultdict

from django.contrib.auth import get_user_model

from studyFlax.fixtures.users.user_fixtures import module_prefix_to_department
from studyFlax.models import Module, RecurrenceRule, UserSettings
from ...shared.helpers import PRIOR_UNIVERSITIES, PHD_UNIVERSITIES, build_settings_for_new_users, build_users_list


User = get_user_model()

FIXED_TEACHER_DEPARTMENTS = {
    "amiller": {"Arts & Humanities"},
}
MAX_MODULES_PER_TEACHER = 5


def _fixed_departments(username):
    return FIXED_TEACHER_DEPARTMENTS.get(username, set())

def _required_teachers(module_count):
    return max(1, (module_count + MAX_MODULES_PER_TEACHER - 1) // MAX_MODULES_PER_TEACHER)

def _append_departments(department_to_pool, teacher, departments):
    for department in departments:
        department_to_pool[department].append(teacher)

def _unassigned_teachers(teachers):
    return [teacher for teacher in teachers if teacher.username not in FIXED_TEACHER_DEPARTMENTS]

def _assign_unassigned_teachers(department_to_pool, teachers, departments):
    ordered = sorted(teachers, key=lambda teacher: teacher.username)
    for index, teacher in enumerate(ordered):
        department_to_pool[departments[index % len(departments)]].append(teacher)

def department_pool(teachers):
    """Build the department-to-teacher pool used for module allocation."""
    department_to_pool = defaultdict(list)
    for teacher in teachers:
        _append_departments(department_to_pool, teacher, _fixed_departments(teacher.username))
    if not teachers:
        return department_to_pool
    departments = sorted(set(module_prefix_to_department.values()))
    _assign_unassigned_teachers(department_to_pool, _unassigned_teachers(teachers), departments)
    return department_to_pool

def base_teachers():
    """Return the existing teachers, with sensible fallbacks for local seeding."""
    teachers = list(User.objects.filter(role="teacher"))
    if teachers:
        return teachers
    fallback = User.objects.filter(is_superuser=True).first()
    if fallback:
        return [fallback]
    return list(User.objects.filter(is_staff=False)[:1])

def weekly_rule():
    """Return the default weekly recurrence rule used for seeded modules."""
    return RecurrenceRule.objects.filter(frequency="weekly", interval=1).first()

def _create_department_teachers(department, needed):
    new_users = build_users_list(needed, role="teacher")
    User.objects.bulk_create(new_users, ignore_conflicts=True)
    UserSettings.objects.bulk_create(build_settings_for_new_users())
    usernames = [user.username for user in new_users]
    teachers = list(User.objects.filter(username__in=usernames))
    UserSettings.objects.filter(user__in=teachers).update(major=department)
    return teachers

def _capacity_gap(current_count, module_count):
    return max(0, _required_teachers(module_count) - current_count)

def ensure_department_capacity(department_to_pool, grouped_specs):
    """Grow any department pool that cannot cover its seeded module load."""
    for department, specs in grouped_specs.items():
        gap = _capacity_gap(len(department_to_pool.get(department, [])), len(specs))
        department_to_pool[department].extend(_create_department_teachers(department, gap) if gap else [])

def ensure_department_coverage(department_to_pool, teachers):
    """Ensure every seeded department has at least one available teacher."""
    if not teachers:
        return
    all_departments = sorted(set(module_prefix_to_department.values()))
    missing = [department for department in all_departments if not department_to_pool.get(department)]
    for index, department in enumerate(missing):
        department_to_pool[department].append(teachers[index % len(teachers)])

def _pick_with_capacity(department_to_pool, cursor, department, load):
    candidates = [teacher for teacher in department_to_pool.get(department, []) if load[teacher.id] < MAX_MODULES_PER_TEACHER]
    if not candidates:
        return None
    index = cursor[department] % len(candidates)
    cursor[department] += 1
    return candidates[index]

def teacher_for_spec(spec, department_to_pool, cursor, load, stdout):
    """Pick or create a teacher for one seeded module spec."""
    department = spec[3]
    teacher = _pick_with_capacity(department_to_pool, cursor, department, load)
    if teacher:
        return teacher
    department_to_pool[department].extend(_create_department_teachers(department, 1))
    teacher = _pick_with_capacity(department_to_pool, cursor, department, load)
    if teacher:
        return teacher
    stdout.write(f"  No teacher capacity for {department}, skipping {spec[0]}.")
    return None

def _department_focus(department):
    themes = {
        "Arts & Humanities": "languages, literature, and cultural analysis",
        "Business": "strategy, leadership, and real-world commercial decision-making",
        "Law": "legal reasoning, case analysis, and policy interpretation",
        "Social Science & Public Policy": "policy design, political institutions, and evidence-led evaluation",
        "Natural, Mathematical & Engineering Sciences": "quantitative methods, modelling, and technical problem-solving",
        "Life Sciences & Medicine": "clinical reasoning, biomedical systems, and translational research",
        "Nursing, Midwifery & Palliative Care": "patient-centred care, clinical communication, and evidence-based practice",
        "Psychiatry, Psychology & Neuroscience": "behaviour, cognition, and brain science in applied contexts",
        "Dentistry, Oral & Craniofacial Sciences": "oral health, anatomy, and modern clinical techniques",
    }
    return themes.get(department, "student success through engaging, practical teaching")

def _stable_index(text, size):
    return sum(ord(char) for char in text) % size

def _teacher_universities(user):
    phd_index = _stable_index(user.username + user.last_name, len(PHD_UNIVERSITIES))
    phd_uni = PHD_UNIVERSITIES[phd_index]
    prior_seed = user.first_name + user.username[::-1]
    prior_uni = PRIOR_UNIVERSITIES[_stable_index(prior_seed, len(PRIOR_UNIVERSITIES))]
    if prior_uni == phd_uni:
        next_index = (PRIOR_UNIVERSITIES.index(prior_uni) + 1) % len(PRIOR_UNIVERSITIES)
        prior_uni = PRIOR_UNIVERSITIES[next_index]
    return phd_uni, prior_uni

def _department_bio(user, department):
    focus = _department_focus(department)
    phd_uni, prior_uni = _teacher_universities(user)
    return (
        f"Dr. {user.first_name} {user.last_name} specialises in {focus}. "
        f"They completed their PhD at {phd_uni} after earlier study at {prior_uni}. "
        f"Based in {department}, they are known for energetic, discussion-rich teaching, "
        "combining academic rigour with practical, career-ready skills and clear feedback students can use immediately."
    )

def sync_teacher_departments():
    """Sync each seeded teacher's department and biography from their modules."""
    teachers = list(User.objects.filter(role="teacher").only("id", "first_name", "last_name", "bio"))
    for teacher in teachers:
        settings, _ = UserSettings.objects.get_or_create(user=teacher)
        taught = list(Module.objects.filter(created_by=teacher).values_list("department", flat=True))
        departments = [department for department in taught if department]
        department = max(set(departments), key=departments.count) if departments else ""
        settings.major = department
        settings.save(update_fields=["major"])
        teacher.bio = _department_bio(teacher, department or "their faculty")
        teacher.save(update_fields=["bio"])
