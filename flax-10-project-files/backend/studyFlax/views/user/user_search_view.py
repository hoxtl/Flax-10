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
    
    users = User.objects.exclude(id=request.user.id)
    
    if query:
        users = users.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).distinct()
        
    if module_param:
        users = users.filter(
            Q(enrollments__module__module_code__icontains=module_param) |
            Q(enrollments__module__module_name__icontains=module_param)
        ).distinct()
        
    users = users[:20]  # Limit results
    serializer = UserSerialiser(users, many=True, context={'request': request})
    
    return Response({'results': serializer.data})
