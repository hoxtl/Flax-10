"""
View for searching and filtering users.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.user_model import User
from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
from django.db.models import Q


_FILTER_MAP = {
    'module': 'enrollments__module__module_code__in',
    'course': 'settings__major__in',
    'society': 'society_memberships__society_id__in',
    'year': 'settings__year__in',
    'role': 'role__in',
}

def _parse_csv(param):
    """Split a comma-separated parameter string into a cleaned list."""
    return [v.strip() for v in param.split(',') if v.strip()]

def _apply_csv_filters(users, params):
    """Apply comma-separated value filters from request params to the queryset."""
    for param_name, lookup in _FILTER_MAP.items():
        values = _parse_csv(params.get(param_name, ''))
        users = users.filter(**{lookup: values}).distinct() if values else users
    return users

def _apply_filters(request):
    """Apply all query parameter filters to the user queryset."""
    params = request.query_params
    users = User.objects.exclude(id=request.user.id)
    query = params.get('q', '').strip()
    if query:
        users = users.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).distinct()
    return _apply_csv_filters(users, params)

def _parse_pagination(params):
    offset = int(params.get('offset', 0))
    limit = int(params.get('limit', 20))
    return offset, limit

def _build_search_response(users, offset, limit, request):
    serialiser = UserSerialiser(users[offset:offset + limit], many=True, context={'request': request})
    total_count = users.count()
    return {
        'results': serialiser.data,
        'total_count': total_count,
        'has_more': offset + limit < total_count,
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_search(request):
    """Search for users by name, module, course, society, year, or role."""
    users = _apply_filters(request)
    offset, limit = _parse_pagination(request.query_params)
    return Response(_build_search_response(users, offset, limit, request))
