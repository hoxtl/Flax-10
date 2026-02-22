from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userModel import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_search(request):
    query = request.query_params.get('q', '').strip()
    if len(query) < 2:
        return Response([])

    users = search_users(query, request.user)
    return Response([serialize_user(u) for u in users])


def search_users(query, current_user):
    return User.objects.filter(username__icontains=query).exclude(id=current_user.id)[:10]


def serialize_user(user):
    return {'id': user.id, 'username': user.username}
