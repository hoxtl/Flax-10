from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Tag, Category
from studyFlax.fixtures.data_fixtures import tag_fixtures
from studyFlax.serialisers import TagSerialiser, CategorySerialiser
from django.db.models import Q


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tag_list(request):
    if request.method == 'GET':
        return get_tags(request)
    return create_tag(request)


def get_tags(request):
    ensure_default_tags_exist()
    tags = Tag.objects.filter(Q(user=request.user) | Q(is_default=True))
    serialiser = TagSerialiser(tags, many=True)
    return Response(serialiser.data)


def ensure_default_tags_exist():
    Tag.objects.get_or_create(
        name='Other',
        user=None,
        defaults={'is_default': True, 'default_duration': 60, 'color': '#9E7E5D', 'icon': '🏷️'},
    )
    for name, duration in tag_fixtures:
        Tag.objects.get_or_create(
            name=name,
            user=None,
            defaults={'is_default': True, 'default_duration': duration},
        )


def create_tag(request):
    serialiser = TagSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    serialiser.save(user=request.user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tag_detail(request, pk):
    try:
        tag = Tag.objects.get(Q(pk=pk) & (Q(user=request.user) | Q(is_default=True)))
    except Tag.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TagSerialiser(tag).data)
    if request.method == 'PATCH':
        if tag.is_default:
            return update_default_tag_icon(tag, request.data)
        return update_tag(tag, request.data)
    if request.method == 'DELETE':
        return delete_tag(tag)

def update_tag(tag, data):
    if tag.name.lower() == 'other' and 'name' in data:
        if data['name'].lower() != 'other':
            return Response({'error': 'Cannot rename Other tag'}, status=status.HTTP_400_BAD_REQUEST)

    serialiser = TagSerialiser(tag, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)


def update_default_tag_icon(tag, data):
    icon = data.get('icon')
    if not icon:
        return Response({'error': 'Only icon can be edited for default tags'}, status=status.HTTP_400_BAD_REQUEST)
    tag.icon = icon
    tag.save()
    return Response(TagSerialiser(tag).data)


def delete_tag(tag):
    if tag.is_default:
        return Response({'error': 'Cannot delete default tags'}, status=status.HTTP_400_BAD_REQUEST)
    if tag.name.lower() == 'other':
        return Response({'error': 'Cannot delete Other tag'}, status=status.HTTP_400_BAD_REQUEST)
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list(request):
    categories = Category.objects.filter(Q(user=request.user) | Q(is_default=True))
    serialiser = CategorySerialiser(categories, many=True)
    return Response(serialiser.data)
