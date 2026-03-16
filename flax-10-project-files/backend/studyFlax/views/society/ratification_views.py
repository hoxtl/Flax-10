from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .helpers import get_society_or_404, is_society_admin, society_not_found_response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_ratification(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if not is_society_admin(request.user, society):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    if society.ratification_status not in ('none', 'rejected'):
        return Response({'error': 'Cannot request ratification'}, status=status.HTTP_400_BAD_REQUEST)
    society.ratification_status = 'pending'
    society.save()
    return Response({'status': 'pending', 'message': 'Ratification requested'})

@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_ratification(request, society_id):
    return handle_ratification_decision(society_id, 'approved')

@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_ratification(request, society_id):
    return handle_ratification_decision(society_id, 'rejected')

def handle_ratification_decision(society_id, decision):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if society.ratification_status != 'pending':
        return Response({'error': 'No pending request'}, status=status.HTTP_400_BAD_REQUEST)
    society.ratification_status = decision
    society.save()
    return Response({'status': decision, 'message': f'Ratification {decision}'})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_ratifications(request):
    from studyFlax.models.society import Society
    from studyFlax.serialisers import SocietyListSerialiser
    societies = Society.objects.filter(ratification_status='pending')
    data = SocietyListSerialiser(societies, many=True).data
    return Response(data)
