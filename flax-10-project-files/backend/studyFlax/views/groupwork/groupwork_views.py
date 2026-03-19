from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.groupwork.groupwork_models import (
    GroupProject,
    GroupMembership,
)
from studyFlax.serialisers.groupwork_serialisers import (
    GroupProjectSerialiser,
    GroupMembershipSerialiser,
)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_list(request):
    if request.method == "GET":
        qs = (
            GroupProject.objects.filter(memberships__user=request.user)
            .annotate(
                member_count=Count("memberships", distinct=True),
                task_count=Count("tasks", distinct=True),
                completed_task_count=Count("tasks", filter=Q(tasks__completed=True), distinct=True),
            )
            .order_by("-created_at")
        )
        serialiser = GroupProjectSerialiser(qs, many=True)
        return Response(serialiser.data)

    serialiser = GroupProjectSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    project = serialiser.save(owner=request.user)
    GroupMembership.objects.create(
        project=project,
        user=request.user,
        role="owner",
    )
    with_members = (
        GroupProject.objects.filter(id=project.id)
        .annotate(
            member_count=Count("memberships", distinct=True),
            task_count=Count("tasks", distinct=True),
            completed_task_count=Count("tasks", filter=Q(tasks__completed=True), distinct=True),
        )
        .first()
    )
    data = GroupProjectSerialiser(with_members).data
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_members(request, project_id):
    project = get_object_or_404(
        GroupProject.objects.all(),
        id=project_id,
        memberships__user=request.user,
    )

    if request.method == "GET":
        memberships = project.memberships.select_related("user").order_by("joined_at")
        serialiser = GroupMembershipSerialiser(memberships, many=True)
        return Response(serialiser.data)

    serialiser = GroupMembershipSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serialiser.validated_data["user"]
    membership, _ = GroupMembership.objects.get_or_create(
        project=project,
        user=user,
        defaults={"role": serialiser.validated_data.get("role", "member")},
    )
    data = GroupMembershipSerialiser(membership).data
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def group_project_detail(request, project_id):
    project = get_object_or_404(
        GroupProject.objects.filter(memberships__user=request.user),
        id=project_id,
    )
    if request.method == "DELETE":
        if project.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serialiser = GroupProjectSerialiser(
        project,
        data=request.data,
        partial=True,
    )
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    with_members = (
        GroupProject.objects.filter(id=project.id)
        .annotate(
            member_count=Count("memberships", distinct=True),
            task_count=Count("tasks", distinct=True),
            completed_task_count=Count("tasks", filter=Q(tasks__completed=True), distinct=True),
        )
        .first()
    )
    data = GroupProjectSerialiser(with_members).data
    return Response(data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def group_project_member_detail(request, project_id, membership_id):
    project = get_object_or_404(
        GroupProject.objects.filter(memberships__user=request.user),
        id=project_id,
    )
    if project.owner_id != request.user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    membership = get_object_or_404(
        GroupMembership.objects.filter(project=project),
        id=membership_id,
    )
    if membership.user_id == project.owner_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
