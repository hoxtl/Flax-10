from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import User

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_username(request):
    username = request.data.get('username', '').strip()
    
    if not username:
        return Response({'available': False, 'error': 'Username is required'})
    
    if len(username) < 3:
        return Response({'available': False, 'error': 'Username must be at least 3 characters'})
    
    # Check if username exists (excluding current user)
    exists = User.objects.filter(username=username).exclude(id=request.user.id).exists()
    
    return Response({'available': not exists})
