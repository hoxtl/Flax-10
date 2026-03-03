from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userModel import User
from studyFlax.serialisers.auth_serialisers import UserSerialiser
from django.db.models import Q


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_search(request):
    query = request.query_params.get('q', '').strip()
    module_param = request.query_params.get('module', '').strip()
    society_param = request.query_params.get('society', '').strip()
    
    users = User.objects.exclude(id=request.user.id)
    
    if query:
        users = users.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).distinct()
        
    if module_param:
        module_codes = [m.strip() for m in module_param.split(',') if m.strip()]
        if module_codes:
            users = users.filter(enrollments__module__module_code__in=module_codes).distinct()
            
    if society_param:
        society_ids = [s.strip() for s in society_param.split(',') if s.strip()]
        if society_ids:
            users = users.filter(society_memberships__society_id__in=society_ids).distinct()
            
    offset = int(request.query_params.get('offset', 0))
    limit = int(request.query_params.get('limit', 20))
    
    total_count = users.count()
    users = users[offset:offset+limit]
    serializer = UserSerialiser(users, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'total_count': total_count,
        'has_more': offset + limit < total_count
    })
