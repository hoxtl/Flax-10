"""
Shared helpers for society views.
"""

from rest_framework import status
from rest_framework.response import Response
from studyFlax.models.society import Society, SocietyMembership, SocietyImage

def get_society_or_404(society_id):
    try:
        return Society.objects.get(pk=society_id)
    except Society.DoesNotExist:
        return None

def get_membership(user, society):
    try:
        return SocietyMembership.objects.get(user=user, society=society)
    except SocietyMembership.DoesNotExist:
        return None

def is_society_admin(user, society):
    membership = get_membership(user, society)
    return membership and membership.is_admin

def is_society_member(user, society):
    return get_membership(user, society) is not None

def society_not_found_response():
    return Response({'error': 'Society not found'}, status=status.HTTP_404_NOT_FOUND)

def permission_denied_response():
    return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

def require_society(view_func):
    def wrapper(request, society_id, *args, **kwargs):
         society = get_society_or_404(society_id)
         if not society:
             return society_not_found_response()
         return view_func(request, society, *args, **kwargs)
    return wrapper

def is_silent_request(request):
    return request.query_params.get('silent', '').lower() == 'true'

def handle_image_urls(society, data):
    image_urls = data.get('image_urls') or data.get('images')
    if image_urls is None:
        return
    society.images.all().delete()
    for url in image_urls:
        SocietyImage.objects.create(society=society, url=url, is_cover=True)

def get_society_object_or_none(model, society, object_id):
    """Return a society-related object for the given model or None if it does not exist."""

    try:
        return model.objects.get(society=society, pk=object_id)
    except model.DoesNotExist:
        return None
