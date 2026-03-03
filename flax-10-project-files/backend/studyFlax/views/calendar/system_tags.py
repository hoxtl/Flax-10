from studyFlax.models import Tag, CalendarEvent

SYSTEM_TAG_CONFIG = {
    'Lecture': {'color': '#4A90D9', 'duration': 120, 'icon': '📚'},
    'Deadline': {'color': '#E74C3C', 'duration': 60, 'icon': '📝'},
    'Exam': {'color': '#9B59B6', 'duration': 180, 'icon': '📋'},
    'Societies': {'color': '#27AE60', 'duration': 120, 'icon': '👨‍👨‍👧‍👧'},
}


def get_system_tag(name):
    config = SYSTEM_TAG_CONFIG.get(name)
    if not config:
        return None
    return find_or_create_system_tag(name, config)


def find_or_create_system_tag(name, config):
    tag = Tag.objects.filter(name=name, is_default=True).first()
    if tag:
        return update_existing_system_tag(tag, config)
    return ensure_system_tag(name, config)


def update_existing_system_tag(tag, config):
    changed = update_tag_fields(tag, config)
    if changed:
        tag.save()
    return tag


def ensure_system_tag(name, config):
    existing_tags = list(Tag.objects.filter(name=name))
    if not existing_tags:
        return create_system_tag(name, config)
    return consolidate_tags(existing_tags, config)


def consolidate_tags(existing_tags, config):
    primary = existing_tags[0]
    merge_duplicate_tags(primary, existing_tags[1:])
    make_tag_system(primary, config)
    return primary


def create_system_tag(name, config):
    return Tag.objects.create(
        name=name, is_default=True, user=None,
        color=config['color'], default_duration=config['duration'],
        icon=config.get('icon', '🏷️')
    )


def merge_duplicate_tags(primary, duplicates):
    for dup in duplicates:
        CalendarEvent.objects.filter(tag=dup).update(tag=primary)
        dup.delete()


def make_tag_system(tag, config):
    changed = update_tag_fields(tag, config)
    if changed:
        tag.save()


def update_tag_fields(tag, config):
    changed = False
    if not tag.is_default:
        tag.is_default, changed = True, True
    if tag.user is not None:
        tag.user, changed = None, True
    if tag.icon != config.get('icon', '🏷️'):
        tag.icon, changed = config.get('icon', '🏷️'), True
    return changed


def get_lecture_tag():
    return get_system_tag('Lecture')


def get_deadline_tag():
    return get_system_tag('Deadline')


def get_exam_tag():
    return get_system_tag('Exam')


def get_societies_tag():
    return get_system_tag('Societies')


def fix_untagged_deadline_events():
    deadline_tag = get_deadline_tag()
    exam_tag = get_exam_tag()
    fix_deadline_events(deadline_tag)
    fix_exam_events(exam_tag)


def fix_deadline_events(deadline_tag):
    CalendarEvent.objects.filter(
        source='module_deadline', tag__isnull=True
    ).exclude(title__istartswith='Exam:').update(tag=deadline_tag)


def fix_exam_events(exam_tag):
    CalendarEvent.objects.filter(
        source='module_deadline', tag__isnull=True, title__istartswith='Exam:'
    ).update(tag=exam_tag)
