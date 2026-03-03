from studyFlax.models import Tag, CalendarEvent

SYSTEM_TAG_CONFIG = {
    'Lecture': {'color': '#4A90D9', 'duration': 120},
    'Deadline': {'color': '#E74C3C', 'duration': 60},
    'Exam': {'color': '#9B59B6', 'duration': 180},
    'Societies': {'color': '#27AE60', 'duration': 120},
}


def get_system_tag(name):
    config = SYSTEM_TAG_CONFIG.get(name)
    if not config:
        return None
    return find_or_create_system_tag(name, config)


def find_or_create_system_tag(name, config):
    tag = Tag.objects.filter(name=name, is_default=True).first()
    if tag:
        return tag
    return ensure_system_tag(name, config)


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
        color=config['color'], default_duration=config['duration']
    )


def merge_duplicate_tags(primary, duplicates):
    for dup in duplicates:
        CalendarEvent.objects.filter(tag=dup).update(tag=primary)
        dup.delete()


def make_tag_system(tag, config):
    if tag.is_default and tag.user is None:
        return
    tag.is_default = True
    tag.user = None
    tag.color = config['color']
    tag.save()


def get_lecture_tag():
    return get_system_tag('Lecture')


def get_deadline_tag():
    return get_system_tag('Deadline')


def get_exam_tag():
    return get_system_tag('Exam')


def get_societies_tag():
    return get_system_tag('Societies')
