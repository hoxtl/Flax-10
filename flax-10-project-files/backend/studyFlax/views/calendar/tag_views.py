from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Tag, Category, Enrollment
from studyFlax.serialisers import TagSerialiser, CategorySerialiser
from django.db.models import Q

PROTECTED_TAGS = {'other', 'lecture'}


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
    has_enrollments = Enrollment.objects.filter(student=user).exists()
    if has_enrollments:
        ensure_default_lecture_tag()
    tags = Tag.objects.filter(Q(user=user) | Q(is_default=True))
    if not has_enrollments:
        tags = tags.exclude(name='Lecture')
    return Response(TagSerialiser(tags, many=True).data)


def ensure_default_lecture_tag():
    from studyFlax.views.modules.enrollment_logic import get_lecture_tag
    get_lecture_tag()


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
