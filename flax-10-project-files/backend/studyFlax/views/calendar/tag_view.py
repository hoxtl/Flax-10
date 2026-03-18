"""
Views for listing, creating, updating, and deleting calendar tags.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Tag, Category, Enrollment
from studyFlax.models.society import SocietyCalendarSync
from studyFlax.serialisers import TagSerialiser, CategorySerialiser
from django.db.models import Q

PROTECTED_TAGS = {'other', 'lecture', 'deadline', 'exam', 'societies'}

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tag_list(request):
    if request.method == 'GET':
        return get_tags(request.user)
    return create_tag(request)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tag_detail(request, pk):
    tag = get_user_tag(pk, request.user)
    if not tag:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return handle_tag_request(request.method, tag, request.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list(request):
    categories = Category.objects.filter(Q(user=request.user) | Q(is_default=True))
    return Response(CategorySerialiser(categories, many=True).data)

def get_tags(user):
    ensure_user_system_tags(user)
    tags = get_filtered_tags(user)
    return Response(TagSerialiser(tags, many=True).data)

def ensure_user_system_tags(user):
    from studyFlax.views.calendar.system_tags import get_lecture_tag, get_deadline_tag
    from studyFlax.views.calendar.system_tags import get_exam_tag, get_societies_tag
    from studyFlax.views.calendar.system_tags import fix_untagged_deadline_events
    if has_module_enrollments(user):
        get_lecture_tag()
        get_deadline_tag()
        get_exam_tag()
        fix_untagged_deadline_events()
    if has_society_syncs(user):
        get_societies_tag()

def has_module_enrollments(user):
    return Enrollment.objects.filter(student=user).exists()

def has_society_syncs(user):
    return SocietyCalendarSync.objects.filter(user=user).exists()

def get_filtered_tags(user):
    tags = Tag.objects.filter(Q(user=user) | Q(is_default=True))
    return filter_conditional_tags(tags, user)

def filter_conditional_tags(tags, user):
    excludes = get_tags_to_exclude(user)
    if excludes:
        tags = tags.exclude(name__in=excludes)
    return tags

def get_tags_to_exclude(user):
    excludes = []
    if not has_module_enrollments(user):
        excludes.extend(['Lecture', 'Deadline', 'Exam'])
    if not has_society_syncs(user):
        excludes.append('Societies')
    return excludes

def get_user_tag(pk, user):
    try:
        return Tag.objects.get(Q(pk=pk) & (Q(user=user) | Q(is_default=True)))
    except Tag.DoesNotExist:
        return None

def handle_tag_request(method, tag, data):
    if method == 'GET':
        return Response(TagSerialiser(tag).data)
    if method == 'PATCH':
        return update_tag(tag, data)
    return delete_tag(tag)

def create_tag(request):
    serialiser = TagSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(user=request.user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

def update_tag(tag, data):
    if is_protected_rename(tag, data):
        return error_response(f'Cannot rename {tag.name} tag')
    if is_restricted_default_tag(tag):
        return update_default_tag_icon(tag, data)
    return save_tag_update(tag, data)

def is_protected_rename(tag, data):
    if 'name' not in data:
        return False
    return tag.name.lower() in PROTECTED_TAGS and data['name'].lower() != tag.name.lower()

def is_restricted_default_tag(tag):
    return tag.is_default and tag.name.lower() not in PROTECTED_TAGS

def update_default_tag_icon(tag, data):
    if 'icon' not in data:
        return error_response('Only icon can be edited for this tag')
    tag.icon = data['icon']
    tag.save()
    return Response(TagSerialiser(tag).data)

def save_tag_update(tag, data):
    serialiser = TagSerialiser(tag, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

def delete_tag(tag):
    if not can_delete_tag(tag):
        return error_response(f'Cannot delete {tag.name} tag')
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

def can_delete_tag(tag):
    if tag.is_default:
        return False
    return tag.name.lower() not in PROTECTED_TAGS

def error_response(message):
    return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
