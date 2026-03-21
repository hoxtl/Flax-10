"""
Views for listing, creating, updating, and deleting society tags.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyTag
from studyFlax.serialisers import SocietyTagSerialiser
from .helpers import (
    get_society_or_404,
    get_society_object_or_none,
    is_society_admin,
    society_not_found_response,
    permission_denied_response,
)


<<<<<<< HEAD
MAX_TAGS = 7

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def society_tag_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_tags(society)
    return create_tag(request, society)

def get_tags(society):
    tags = SocietyTag.objects.filter(society=society)
    return Response(SocietyTagSerialiser(tags, many=True).data)

def create_tag(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    if society.tags.count() >= MAX_TAGS:
        return Response({'error': f'Maximum {MAX_TAGS} tags allowed'}, status=status.HTTP_400_BAD_REQUEST)
    serialiser = SocietyTagSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(society=society)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def society_tag_detail(request, society_id, tag_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    return _society_tag_detail_result(request.method, request.data, society, tag_id)

<<<<<<< HEAD
def _society_tag_detail_result(method, data, society, tag_id):
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    tag = get_society_object_or_none(SocietyTag, society, tag_id)
    if not tag:
        return _society_tag_not_found_response()
    return _society_tag_detail_response(method, tag, data)

def _society_tag_not_found_response():
    return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)

def _society_tag_detail_response(method, tag, data):
    if method == 'DELETE':
        return delete_tag(tag)
<<<<<<< HEAD
    return update_tag(tag, data)
=======
    return update_tag(tag, request.data)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def update_tag(tag, data):
    serialiser = SocietyTagSerialiser(tag, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

def delete_tag(tag):
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
