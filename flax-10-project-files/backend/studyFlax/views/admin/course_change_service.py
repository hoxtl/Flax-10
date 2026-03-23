"""
Service helpers for course change request workflows.
"""

from django.db import DatabaseError
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import CalendarEvent, Enrollment
from studyFlax.models.auth.course_change_request_model import CourseChangeRequest
from studyFlax.models.notifications.notification_model import Notification
from studyFlax.serialisers.modules.course_change_serialisers import CourseChangeRequestSerialiser
from studyFlax.views.user.settings_view import enroll_user_in_modules, get_modules_for_major


def validate_course_change_request(user, requested_course, get_user_settings):
    settings_obj = get_user_settings(user)
    current_course = settings_obj.major or ""
    if requested_course == current_course:
        raise ValueError("Requested course is the same as your current course")
    if CourseChangeRequest.objects.filter(user=user, status="pending").exists():
        raise ValueError("You already have a pending course change request")
    return current_course


def create_course_change_request(user, requested_course, get_user_settings):
    current_course = validate_course_change_request(user, requested_course, get_user_settings)
    return CourseChangeRequest.objects.create(
        user=user,
        requested_course=requested_course,
        current_course=current_course,
    )


def handle_request_creation(user, requested_course, get_user_settings):
    change_request = create_course_change_request(user, requested_course, get_user_settings)
    return CourseChangeRequestSerialiser(change_request).data


def handle_request_creation_error(error):
    if isinstance(error, ValueError):
      return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    if isinstance(error, DatabaseError):
      return Response({"error": "Unable to create request right now."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    raise error


def pending_request_response(change_request):
    if change_request and change_request.status == "pending":
        return change_request
    return None


def serialise_optional_request(change_request):
    return CourseChangeRequestSerialiser(change_request).data if change_request else None


def can_delete_pending_request(change_request):
    return bool(change_request and change_request.status == "pending")


def delete_pending_request(change_request):
    change_request.delete()


def clear_existing_enrollments(user, old_module_ids):
    CalendarEvent.objects.filter(
        user=user,
        module_id__in=old_module_ids,
        source__in=["module_enrollment", "module_deadline"],
    ).delete()
    Enrollment.objects.filter(student=user, module_id__in=old_module_ids).delete()


def update_student_course(settings_obj, requested_course):
    settings_obj.major = requested_course
    settings_obj.save(update_fields=["major"])


def notify_course_change_approved(change_request):
    Notification.objects.create(
        user=change_request.user,
        title="Course change approved",
        message=f"Your request to change to {change_request.requested_course} has been approved. Your course has been updated.",
        notification_type="general",
        action_url="/settings?tab=account",
    )


def notify_course_change_rejected(change_request):
    Notification.objects.create(
        user=change_request.user,
        title="Course change rejected",
        message=f"Your request to change to {change_request.requested_course} was rejected. You can submit a new request from settings.",
        notification_type="general",
        action_url="/settings?tab=account",
    )


def apply_approval(change_request, get_user_settings):
    settings_obj = get_user_settings(change_request.user)
    old_module_ids = [module.pk for module in get_modules_for_major(settings_obj.major)]
    clear_existing_enrollments(change_request.user, old_module_ids)
    update_student_course(settings_obj, change_request.requested_course)
    enroll_user_in_modules(change_request.user, get_modules_for_major(change_request.requested_course))
    notify_course_change_approved(change_request)


def update_decision_fields(change_request, decision):
    change_request.status = "approved" if decision == "approve" else "rejected"
    change_request.resolved_at = timezone.now()
    change_request.save()
    return change_request.status


def apply_decision_effects(change_request, status_value, get_user_settings):
    if status_value == "approved":
        apply_approval(change_request, get_user_settings)
        return
    notify_course_change_rejected(change_request)


def apply_decision(change_request, decision, get_user_settings):
    status_value = update_decision_fields(change_request, decision)
    apply_decision_effects(change_request, status_value, get_user_settings)


def validate_decision(decision):
    if decision in ("approve", "reject"):
        return None
    return Response({"error": "decision must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)
