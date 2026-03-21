"""
Views for society membership management.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyMembership, SocietyCalendarSync
from studyFlax.models.auth.user_model import User
from studyFlax.serialisers import SocietyMembershipSerialiser
from .helpers import (
    get_society_or_404, get_membership, is_society_admin,
    society_not_found_response, permission_denied_response
)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def membership_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_members(request, society)
    if 'username' in request.data or 'email' in request.data:
        return add_collaborator(request, society)
    return join_society(request.user, society)

def get_members(request, society):
    members = SocietyMembership.objects.filter(society=society)

    return Response(SocietyMembershipSerialiser(members, many=True, context={'request': request}).data)

def join_society(user, society):
    if getattr(user, 'role', None) == 'teacher':
        return Response(
            {'error': 'Teachers cannot join societies.'},
            status=status.HTTP_403_FORBIDDEN
        )
    if get_membership(user, society):
        return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)

    membership = SocietyMembership.objects.create(user=user, society=society)
    return Response(SocietyMembershipSerialiser(membership).data, status=status.HTTP_201_CREATED)

def add_collaborator(request, society):
<<<<<<< HEAD
    payload, errors, status_code = add_collaborator_result(request.user, request.data, society)

    if errors:
        return Response(errors, status=status_code)
    return Response(payload, status=status_code)

def add_collaborator_result(actor, data, society):
    access_error = collaborator_access_error(actor, society)
    if access_error:
        return None, access_error.data, access_error.status_code
    user, user_error, user_status = collaborator_target(data, society)

    if user_error:
        return None, user_error, user_status
    membership = create_collaborator_membership(user, society, data)
    return SocietyMembershipSerialiser(membership).data, None, status.HTTP_201_CREATED

def collaborator_access_error(actor, society):
    if not is_society_admin(actor, society):
        return permission_denied_response()
    return None

def collaborator_target(data, society):
    user = find_user_by_identifier(data)
    if not user:

        return None, {'error': 'User not found'}, status.HTTP_404_NOT_FOUND
    if getattr(user, 'role', None) == 'teacher':

        return None, {'error': 'Teachers cannot join societies.'}, status.HTTP_403_FORBIDDEN
    if get_membership(user, society):
        return None, {'error': 'Already a member'}, status.HTTP_400_BAD_REQUEST
    return user, None, None

def create_collaborator_membership(user, society, data):
    return SocietyMembership.objects.create(user=user, society=society, role=data.get('role', 'editor'))

=======
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    user = find_user_by_identifier(request.data)
    if not user:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    if getattr(user, 'role', None) == 'teacher':
        return Response({'error': 'Teachers cannot join societies.'}, status=status.HTTP_403_FORBIDDEN)
    if get_membership(user, society):
        return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)
    role = request.data.get('role', 'editor')
    membership = SocietyMembership.objects.create(user=user, society=society, role=role)
    return Response(SocietyMembershipSerialiser(membership).data, status=status.HTTP_201_CREATED)

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def find_user_by_identifier(data):
    username = data.get('username')
    email = data.get('email')
    if username:
        return User.objects.filter(username=username).first()
    if email:
        return User.objects.filter(email=email).first()
    return None

@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def membership_detail(request, society_id, user_id=None):

    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    actual_user_id = request.user.id if user_id is None else int(user_id)
    if request.method == 'DELETE':
        return leave_or_remove(request, society, actual_user_id)

    return update_role(request, society, actual_user_id)

def leave_or_remove(request, society, user_id):
    error_response = leave_or_remove_error(request.user, society, user_id)
    if error_response:
        return error_response
    membership = get_membership_by_user_id(society, user_id)

<<<<<<< HEAD
    remove_membership(membership, request.user.id == user_id, society, user_id)
    return Response(status=status.HTTP_204_NO_CONTENT)

def leave_or_remove_error(actor, society, user_id):
    is_self = actor.id == user_id

    if not is_self and not is_society_admin(actor, society):
        return permission_denied_response()
    if get_membership_by_user_id(society, user_id):
        return None
    return Response({'error': 'Not a member'}, status=status.HTTP_404_NOT_FOUND)

def remove_membership(membership, is_self, society, user_id):
    SocietyCalendarSync.objects.filter(user_id=user_id, society=society).delete()
    if is_self:
        membership._skip_notification = True
    membership.delete()

=======
    SocietyCalendarSync.objects.filter(user_id=user_id, society=society).delete()
    if is_self:
        membership._skip_notification = True

    membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def update_role(request, society, user_id):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    membership = get_membership_by_user_id(society, user_id)

    if not membership:
        return Response({'error': 'Not a member'}, status=status.HTTP_404_NOT_FOUND)
    serialiser = SocietyMembershipSerialiser(membership, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

def get_membership_by_user_id(society, user_id):
    try:
        return SocietyMembership.objects.get(society=society, user_id=user_id)
    except SocietyMembership.DoesNotExist:
        return None

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_subscription(request, society_id):
    payload, errors, status_code = toggle_subscription_result(request.user, request.data, society_id)
    if errors:
        return Response(errors, status=status_code)
    return Response(payload)

def toggle_subscription_result(user, data, society_id):
    society = get_society_or_404(society_id)
    if not society:
        response = society_not_found_response()
        return None, response.data, response.status_code
    membership = get_membership(user, society)
    if not membership:
        return None, {'error': 'Not a member'}, status.HTTP_403_FORBIDDEN
    membership.is_subscribed = data.get('is_subscribed', not membership.is_subscribed)
    membership.save(update_fields=['is_subscribed'])
    return {'is_subscribed': membership.is_subscribed}, None, status.HTTP_200_OK
