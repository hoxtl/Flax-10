"""
Service helpers for group project view flows.
"""

from django.contrib.auth import get_user_model
from django.db.models import Count, OuterRef, Q, Subquery, Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.models.modules.module_model import Module
from studyFlax.serialisers.tasks.groupwork_serialisers import GroupMembershipSerialiser, GroupProjectSerialiser
from studyFlax.views.groupwork.groupwork_limits import (
    MAX_GROUP_PROJECTS_PER_USER,
    group_project_limit_message,
)

User = get_user_model()


def serialiser_context(request):
    return {"request": request}


def parse_member_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def collect_unique_ids(raw_ids):
    parsed = [parse_member_id(value) for value in raw_ids]
    if None in parsed:
        return None
    return list(dict.fromkeys(parsed))


def normalise_member_ids(raw_member_ids):
    if raw_member_ids in (None, "", []):
        return []
    if not isinstance(raw_member_ids, list):
        return None
    return collect_unique_ids(raw_member_ids)


def validate_member_ids(member_ids):
    if member_ids is None:
        return Response({"member_ids": ["Provide member IDs as a list of user IDs."]}, status=status.HTTP_400_BAD_REQUEST)
    existing_ids = set(User.objects.filter(id__in=member_ids).values_list("id", flat=True))
    missing_ids = [member_id for member_id in member_ids if member_id not in existing_ids]
    if missing_ids:
        missing = ", ".join(str(member_id) for member_id in missing_ids)
        return Response({"member_ids": [f"Some selected users were not found: {missing}."]}, status=status.HTTP_400_BAD_REQUEST)
    return None


def validate_users_within_project_limit(user_ids):
    if not user_ids:
        return None
    over_limit = (
        User.objects.filter(id__in=user_ids)
        .annotate(project_total=Count("group_memberships"))
        .filter(project_total__gte=MAX_GROUP_PROJECTS_PER_USER)
        .order_by("username")
    )
    if not over_limit.exists():
        return None
    names = ", ".join(user.username for user in over_limit)
    return Response(
        {"member_ids": [f"{group_project_limit_message()} Over limit: {names}."]},
        status=status.HTTP_400_BAD_REQUEST,
    )


def validate_user_within_project_limit(user):
    if GroupMembership.objects.filter(user=user).count() < MAX_GROUP_PROJECTS_PER_USER:
        return None
    return Response({"detail": group_project_limit_message()}, status=status.HTTP_400_BAD_REQUEST)


def validate_project_create_input(data):
    member_ids = normalise_member_ids(data.get("member_ids", []))
    if member_ids is None:
        return None, {"member_ids": ["Provide member IDs as a list of user IDs."]}, status.HTTP_400_BAD_REQUEST
    member_error = validate_member_ids(member_ids) if member_ids else None
    if member_error:
        return None, member_error.data, member_error.status_code
    limit_error = validate_users_within_project_limit(member_ids)
    if limit_error:
        return None, limit_error.data, limit_error.status_code
    return member_ids, None, None


def project_create_payload(data):
    payload = {key: value for key, value in data.items() if key != "member_ids"}
    if "course_code" not in payload:
        payload["course_code"] = ""
    return payload


def validate_project_deadline(deadline):
    if not deadline:
        return None
    deadline_date = deadline.date() if hasattr(deadline, "date") else deadline
    if deadline_date < timezone.localdate():
        return Response({"deadline": ["Project due date can't be in the past."]}, status=status.HTTP_400_BAD_REQUEST)
    return None


def create_project_memberships(project, owner, member_ids):
    GroupMembership.objects.bulk_create(build_project_memberships(project, owner, member_ids), ignore_conflicts=True)


def non_owner_members(owner, member_ids):
    return User.objects.filter(id__in=member_ids).exclude(id=owner.id).order_by("id")


def build_project_memberships(project, owner, member_ids):
    return [GroupMembership(project=project, user=user, role="member") for user in non_owner_members(owner, member_ids)]


def module_tutor_subqueries(module_base):
    return {
        "module_tutor_id": Subquery(module_base.values("created_by_id")[:1]),
        "module_tutor_name": Subquery(
            module_base.annotate(full_name=Concat("created_by__first_name", Value(" "), "created_by__last_name")).values("full_name")[:1]
        ),
        "module_tutor_username": Subquery(module_base.values("created_by__username")[:1]),
        "module_tutor_email": Subquery(module_base.values("created_by__email")[:1]),
        "module_tutor_profile_photo": Subquery(module_base.values("created_by__profile_photo")[:1]),
    }


def project_metrics_queryset():
    return annotate_project_metrics(GroupProject.objects.all())


def annotate_project_metrics(queryset):
    return queryset.annotate(module_name=module_name_annotation(), **project_metric_annotations(), **project_tutor_annotations())


def project_metric_annotations():
    return {
        "member_count": Count("memberships", distinct=True),
        "task_count": Count("tasks", distinct=True),
        "completed_task_count": Count("tasks", filter=Q(tasks__completed=True), distinct=True),
    }


def project_tutor_annotations():
    module_base = Module.objects.filter(module_code=OuterRef("course_code"))
    return module_tutor_subqueries(module_base)


def module_name_annotation():
    return Subquery(Module.objects.filter(module_code=OuterRef("course_code")).values("module_name")[:1])


def with_project_metrics(project):
    return project_metrics_queryset().filter(id=project.id).first()


def project_list_response(request):
    queryset = project_metrics_queryset().filter(memberships__user=request.user).order_by("-created_at")[:MAX_GROUP_PROJECTS_PER_USER]
    return Response(GroupProjectSerialiser(queryset, many=True, context=serialiser_context(request)).data)


def create_project_result(data, user, context):
    member_ids, member_error, member_status = validate_project_create_input(data)
    if member_error:
        return None, member_error, member_status
    owner_limit_error = validate_user_within_project_limit(user)
    if owner_limit_error:
        return None, owner_limit_error.data, owner_limit_error.status_code
    serialiser = GroupProjectSerialiser(data=project_create_payload(data), context=context)
    if not serialiser.is_valid():
        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    return create_valid_project_data(serialiser, user, member_ids, context)


def create_valid_project_data(serialiser, user, member_ids, context):
    deadline_error = validate_project_deadline(serialiser.validated_data.get("deadline"))
    if deadline_error:
        return None, deadline_error.data, deadline_error.status_code
    project = save_project_with_members(serialiser, user, member_ids)
    return serialised_project(project, context), None, status.HTTP_201_CREATED


def save_project_with_members(serialiser, owner, member_ids):
    project = serialiser.save(owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    create_project_memberships(project, owner, member_ids)
    return project


def get_project_for_user(user, project_id):
    return get_object_or_404(GroupProject.objects.filter(memberships__user=user), id=project_id)


def list_project_members_response(project, request):
    memberships = project.memberships.select_related("user").order_by("joined_at")
    return Response(GroupMembershipSerialiser(memberships, many=True, context=serialiser_context(request)).data)


def add_member_to_project_response(project, request):
    if project.owner_id != request.user.id:
        return Response({"detail": "Only the project owner can edit team members."}, status=status.HTTP_403_FORBIDDEN)
    serialiser = GroupMembershipSerialiser(data=request.data, context=serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    target_user = serialiser.validated_data["user"]
    is_existing_member = GroupMembership.objects.filter(project=project, user=target_user).exists()
    if not is_existing_member:
        limit_error = validate_user_within_project_limit(target_user)
        if limit_error:
            return limit_error
    membership = save_project_member(project, serialiser.validated_data)
    return Response(GroupMembershipSerialiser(membership, context=serialiser_context(request)).data, status=status.HTTP_201_CREATED)


def save_project_member(project, validated_data):
    return GroupMembership.objects.get_or_create(
        project=project,
        user=validated_data["user"],
        defaults={"role": validated_data.get("role", "member")},
    )[0]


def delete_project_response(project, user):
    if project.owner_id != user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


def update_project_result(project, request):
    serialiser = GroupProjectSerialiser(project, data=request.data, partial=True, context=serialiser_context(request))
    if not serialiser.is_valid():
        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    return update_valid_project_data(project, request, serialiser)


def update_valid_project_data(project, request, serialiser):
    deadline_error = validate_project_deadline(serialiser.validated_data.get("deadline"))
    if deadline_error:
        return None, deadline_error.data, deadline_error.status_code
    serialiser.save()
    return serialised_project(project, serialiser_context(request)), None, status.HTTP_200_OK


def serialised_project(project, context):
    if not isinstance(context, dict):
        context = serialiser_context(context)
    return GroupProjectSerialiser(with_project_metrics(project), context=context).data


def remove_project_member(project, user, membership_id):
    if project.owner_id != user.id:
        return status.HTTP_403_FORBIDDEN
    membership = get_object_or_404(GroupMembership.objects.filter(project=project), id=membership_id)
    if membership.user_id == project.owner_id:
        return status.HTTP_400_BAD_REQUEST
    delete_project_member(membership)
    return status.HTTP_204_NO_CONTENT


def delete_project_member(membership):
    membership.delete()
