"""
Views for managing group projects and their memberships.
"""

from django.contrib.auth import get_user_model
from django.db.models import Count, OuterRef, Q, Subquery, Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
from studyFlax.models.modules.module_model import Module
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupProjectSerialiser,
    GroupMembershipSerialiser,
)

User = get_user_model()

MIN_PROJECT_MEMBER_TOTAL = 5
MAX_PROJECT_MEMBER_TOTAL = 10


def _serialiser_context(request):
    return {"request": request}


def _parse_member_id(value):
    """Return int ID or None if value cannot be parsed."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _collect_unique_ids(raw_ids):
    """Return a deduped list of parsed IDs, or None if any value is invalid."""
    parsed = [_parse_member_id(v) for v in raw_ids]
    if None in parsed:
        return None
    return list(dict.fromkeys(parsed))

def _normalise_member_ids(raw_member_ids):
    if raw_member_ids in (None, "", []):
        return []
    if not isinstance(raw_member_ids, list):
        return None
    return _collect_unique_ids(raw_member_ids)


def _validate_member_ids(member_ids):
    if member_ids is None:
        return Response({"member_ids": ["Provide member IDs as a list of user IDs."]}, status=status.HTTP_400_BAD_REQUEST)
    existing_ids = set(User.objects.filter(id__in=member_ids).values_list("id", flat=True))
    missing_ids = [member_id for member_id in member_ids if member_id not in existing_ids]
    if missing_ids:
        return Response({"member_ids": [f"Some selected users were not found: {', '.join(str(member_id) for member_id in missing_ids)}."]}, status=status.HTTP_400_BAD_REQUEST)
    return None

def _build_team_size_error(total, min_size, max_size):
    """Return a 400 Response for an out-of-range team size, or None if valid."""
    if total < min_size:
        return Response(
            {"member_ids": [f"Projects must have at least {min_size} total members."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if total > max_size:
        return Response(
            {"member_ids": [f"Projects can have at most {max_size} total members."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None

def _validate_project_team_size(member_ids, owner_id=None):
    filtered_member_ids = [
        member_id for member_id in (member_ids or [])
        if owner_id is None or member_id != owner_id
    ]
    total_members = len(filtered_member_ids) + 1
    return _build_team_size_error(total_members, MIN_PROJECT_MEMBER_TOTAL, MAX_PROJECT_MEMBER_TOTAL)


def _validate_project_create_request(data, owner_id=None):
    course_code = str(data.get("course_code") or "").strip()
    if not course_code:
        return None, Response({"course_code": ["Select a module for this project."]}, status=status.HTTP_400_BAD_REQUEST)
    member_ids = _normalise_member_ids(data.get("member_ids", []))
    if member_ids is None:
        return None, Response({"member_ids": ["Provide member IDs as a list of user IDs."]}, status=status.HTTP_400_BAD_REQUEST)
    if not member_ids:
        teammate_minimum = max(MIN_PROJECT_MEMBER_TOTAL - 1, 1)
        return None, Response(
            {"member_ids": [f"Select at least {teammate_minimum} teammates."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    member_error = _validate_member_ids(member_ids)
    if member_error:
        return None, member_error
    team_size_error = _validate_project_team_size(member_ids, owner_id=owner_id)
    if team_size_error:
        return None, team_size_error
    return member_ids, None


def _create_project_memberships(project, owner, member_ids):
    if not member_ids:
        return
    non_owners = [user for user in User.objects.filter(id__in=member_ids).order_by("id") if user.id != owner.id]
    for user in non_owners:
        GroupMembership.objects.get_or_create(project=project, user=user, defaults={"role": "member"})


def _project_create_payload(data):
    return {key: value for key, value in data.items() if key != "member_ids"}


def _validate_project_deadline(deadline):
    if not deadline:
        return None
    deadline_date = deadline.date() if hasattr(deadline, "date") else deadline
    if deadline_date < timezone.localdate():
        return Response({"deadline": ["Project due date can't be in the past."]}, status=status.HTTP_400_BAD_REQUEST)
    return None


def _module_tutor_subqueries(module_base):
    """Return a dict of tutor annotation subqueries for a module queryset."""
    return {
        "module_tutor_id": Subquery(module_base.values("created_by_id")[:1]),
        "module_tutor_name": Subquery(
            module_base.annotate(full_name=Concat("created_by__first_name", Value(" "), "created_by__last_name")).values("full_name")[:1]
        ),
        "module_tutor_username": Subquery(module_base.values("created_by__username")[:1]),
        "module_tutor_email": Subquery(module_base.values("created_by__email")[:1]),
        "module_tutor_profile_photo": Subquery(module_base.values("created_by__profile_photo")[:1]),
    }

def _project_metrics_queryset():
    module_base = Module.objects.filter(module_code=OuterRef("course_code"))
    tutor_annotations = _module_tutor_subqueries(module_base)
    return GroupProject.objects.annotate(
        member_count=Count("memberships", distinct=True),
        task_count=Count("tasks", distinct=True),
        completed_task_count=Count("tasks", filter=Q(tasks__completed=True), distinct=True),
        module_name=Subquery(module_base.values("module_name")[:1]),
        **tutor_annotations,
    )

def _with_project_metrics(project):
    """Return the project annotated with member, task, and module context."""
    return _project_metrics_queryset().filter(id=project.id).first()

def _handle_project_delete(project, user):
    """Delete the project if the user is the owner, otherwise return 403."""
    if project.owner_id != user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

def _project_member_total(project):
    return project.memberships.count()

def _reject_project_team_limit(message):
    return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_list(request):
    """List all group projects for the user, or create a new one."""
    if request.method == "GET":
        qs = _project_metrics_queryset().filter(memberships__user=request.user).order_by("-created_at")
        return Response(GroupProjectSerialiser(qs, many=True, context=_serialiser_context(request)).data)
    member_ids, member_error = _validate_project_create_request(request.data, owner_id=request.user.id)
    if member_error:
        return member_error
    serialiser = GroupProjectSerialiser(data=_project_create_payload(request.data), context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    deadline_error = _validate_project_deadline(serialiser.validated_data.get("deadline"))
    if deadline_error:
        return deadline_error
    project = serialiser.save(owner=request.user)
    GroupMembership.objects.create(project=project, user=request.user, role="owner")
    _create_project_memberships(project, request.user, member_ids)
    return Response(
        GroupProjectSerialiser(_with_project_metrics(project), context=_serialiser_context(request)).data,
        status=status.HTTP_201_CREATED,
    )

def _add_member_to_project(project, request):
    """Handle POST logic for adding a member to a project."""
    if project.owner_id != request.user.id:
        return Response({"detail": "Only the project owner can edit team members."}, status=status.HTTP_403_FORBIDDEN)
    serialiser = GroupMembershipSerialiser(data=request.data, context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serialiser.validated_data["user"]
    if GroupMembership.objects.filter(project=project, user=user).exists():
        membership = GroupMembership.objects.get(project=project, user=user)
        return Response(GroupMembershipSerialiser(membership, context=_serialiser_context(request)).data, status=status.HTTP_200_OK)
    if _project_member_total(project) >= MAX_PROJECT_MEMBER_TOTAL:
        return _reject_project_team_limit(f"Projects can have at most {MAX_PROJECT_MEMBER_TOTAL} total members.")
    membership, _ = GroupMembership.objects.get_or_create(
        project=project, user=user,
        defaults={"role": serialiser.validated_data.get("role", "member")},
    )
    return Response(GroupMembershipSerialiser(membership, context=_serialiser_context(request)).data, status=status.HTTP_201_CREATED)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_members(request, project_id):
    """List members of a project, or add a new member."""
    project = get_object_or_404(GroupProject.objects.all(), id=project_id, memberships__user=request.user)
    if request.method == "GET":
        memberships = project.memberships.select_related("user").order_by("joined_at")
        return Response(GroupMembershipSerialiser(memberships, many=True, context=_serialiser_context(request)).data)
    return _add_member_to_project(project, request)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def group_project_detail(request, project_id):
    """Update or delete a group project."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if request.method == "DELETE":
        return _handle_project_delete(project, request.user)
    serialiser = GroupProjectSerialiser(project, data=request.data, partial=True, context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    deadline_error = _validate_project_deadline(serialiser.validated_data.get("deadline"))
    if deadline_error:
        return deadline_error
    serialiser.save()
    return Response(GroupProjectSerialiser(_with_project_metrics(project), context=_serialiser_context(request)).data)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def group_project_member_detail(request, project_id, membership_id):
    """Remove a member from a group project (owner only)."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if project.owner_id != request.user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    membership = get_object_or_404(GroupMembership.objects.filter(project=project), id=membership_id)
    if membership.user_id == project.owner_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if _project_member_total(project) <= MIN_PROJECT_MEMBER_TOTAL:
        return _reject_project_team_limit(
            f"Projects must keep at least {MIN_PROJECT_MEMBER_TOTAL} total members."
        )
    membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
