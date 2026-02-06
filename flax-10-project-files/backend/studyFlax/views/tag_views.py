from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Tag, Category
from studyFlax.serialisers import TagSerialiser, CategorySerialiser
from django.db.models import Q

@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
def tag_list(request):
    if request.method == 'GET':
        return get_tags(request)
    return create_tag(request)

def get_tags(request):
    tags = Tag.objects.filter(Q(user=user) | Q(is_default=True))
    serialiser = TagSerialiser(tags, many=True)
    return Response(serialiser.data)

def create_tag(request):
    serialiser = TagSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # serialiser.save(user=request.user) # Uncomment when we have user authentication
    serialiser.save() # Remove when we have user authentication
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def category_list(request):
    # categories = Category.objects.filter(Q(user=request.user) | Q(is_default=True)) # Uncomment when we have user authentication
    categories = Category.objects.all() # Remove when we have user authentication
    serialiser = CategorySerialiser(categories, many=True)
    return Response(serialiser.data)
    

    