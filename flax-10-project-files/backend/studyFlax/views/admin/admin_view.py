"""
Compatibility exports for admin views.
"""

from studyFlax.views.admin.reported_society_view import (
    ban_reported_society,
    dismiss_report,
    reported_societies,
)
from studyFlax.views.admin.teacher_request_view import (
    cancel_teacher_role_request,
    request_teacher_role,
    resolve_teacher_request,
    teacher_requests,
)
from studyFlax.views.admin.user_management_view import ban_user, user_list

_ = (
    ban_reported_society,
    dismiss_report,
    reported_societies,
    cancel_teacher_role_request,
    request_teacher_role,
    resolve_teacher_request,
    teacher_requests,
    ban_user,
    user_list,
)
