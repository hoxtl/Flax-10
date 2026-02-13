from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Tag, Category
from studyFlax.serialisers import TagSerialiser, CategorySerialiser
from django.db.models import Q

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tag_list(request):
    if request.method == 'GET':
        return get_tags(request)
    return create_tag(request)

def get_tags(request):
    tags = Tag.objects.filter(Q(user=request.user) | Q(is_default=True))
    serialiser = TagSerialiser(tags, many=True)
    return Response(serialiser.data)

def create_tag(request):
    serialiser = TagSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    serialiser.save(user=request.user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PATCH', 'DELETE'])
def tag_detail(request, pk):
    try:
        tag = Tag.objects.get(pk=pk)
    except Tag.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TagSerialiser(tag).data)
    if request.method == 'PATCH':
        return update_tag(tag, request.data)
    if request.method == 'DELETE':
        return delete_tag(tag)

def update_tag(tag, data):
    serialiser = TagSerialiser(tag, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

def delete_tag(tag):
    if tag.name.lower() == 'other':
        return Response({'error': 'Cannot delete Other tag'}, status=status.HTTP_400_BAD_REQUEST)
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list(request):
    categories = Category.objects.all()
    serialiser = CategorySerialiser(categories, many=True)
    return Response(serialiser.data)
    

    