from django.urls import path, include
from rest_framework.routers import DefaultRouter

#Router
router = DefaultRouter()
from studyFlax.views.timerViews import StudySessionViewSet
router.register(r'timer/history', StudySessionViewSet, basename='study-session')

from studyFlax.views.social.share_views import CalendarShareViewSet
router.register(r'social', CalendarShareViewSet, basename='social')

# Authentication
from studyFlax.views.authentication.register_view import register_view
from studyFlax.views.authentication.login_view import login_view
from studyFlax.views.authentication.logout_view import logout_view
from studyFlax.views.authentication.password_reset_request_view import reset_password_view
from studyFlax.views.authentication.confirm_password_reset_view import confirm_password_reset_view

# User
from studyFlax.views.user.profile_view import profile_view, another_user_profile_view
from studyFlax.views.user.profile_summary_view import profile_summary_view
from studyFlax.views.user.check_username_view import check_username
from studyFlax.views.user.user_search_view import user_search
from studyFlax.views.user.settings_views import onboarding_view
from studyFlax.views.settings.user_settings_view import user_settings_view

# Calendar
from studyFlax.views.calendar.event_views import event_list
from studyFlax.views.calendar.event_detail_views import event_detail, add_exception_date
from studyFlax.views.calendar.tag_views import tag_list, tag_detail, category_list
from studyFlax.views.calendar.timetable_views import timetable_import
from studyFlax.views.calendar.attendance_views import (
    record_attendance,
    attendance_stats,
    attendance_records,
)

# Modules
from studyFlax.views.modules.module_views import module_list, module_detail
from studyFlax.views.modules.enrollment_views import enrollment_list, enrollment_detail

from studyFlax.views.authentication.register_view import register_view
from studyFlax.views.authentication.login_view import login_view
from studyFlax.views.authentication.logout_view import logout_view
from studyFlax.views.notifications import notification_list, notification_detail, mark_all_read, clear_all
from studyFlax.views.settings.user_settings_view import user_settings_view

# Tasks
from studyFlax.views.tasks.task_views import (
    task_list_list, task_list_detail, task_list, task_detail, log_task_time
)
from studyFlax.views.groupwork.groupwork_views import (
    group_project_list,
    group_project_members,
    group_project_detail,
    group_project_member_detail,
)
from studyFlax.views.groupwork.availability_views import group_availability
from studyFlax.views.groupwork.suggestion_views import create_suggestion, respond_to_suggestion, delete_suggestion

# Societies
from studyFlax.views.society import (
    society_list, society_detail, membership_list, membership_detail,
    society_tag_list, society_tag_detail, announcement_list, announcement_detail,
    event_list as society_event_list, event_detail as society_event_detail,
    sync_status, sync_calendar, unsync_calendar,
    request_ratification, approve_ratification, reject_ratification, pending_ratifications,
    add_society_event_exception, publish_changes, report_society, toggle_subscription
)
# Notifications
from studyFlax.views.notifications import notification_list, notification_detail, mark_all_read, clear_all

from studyFlax.views.user.profile_summary_view import profile_summary_view
from studyFlax.views.user.check_username_view import check_username
from studyFlax.views.user.user_search_view import user_search
from studyFlax.views.authentication.password_reset_request_view import reset_password_view
from studyFlax.views.authentication.confirm_password_reset_view import confirm_password_reset_view
from studyFlax.views.user.profile_view import profile_view, another_user_profile_view

# Analytics
from studyFlax.views.analytics.analytics_views import get_analytics_summary, get_progress_data
from studyFlax.views.analytics import log_theme_session, get_theme_stats, get_ai_insights, ai_chat
from studyFlax.views.user.settings_views import onboarding_view
from studyFlax.views.modules.deadline_views import deadline_list, deadline_detail, upcoming_deadlines
from studyFlax.views.authentication.home_address_view import home_address_view

# Admin
from studyFlax.views.admin.admin_views import (
    user_list, ban_user,
    teacher_requests, resolve_teacher_request,
    reported_societies, dismiss_report, ban_reported_society,
    request_teacher_role, cancel_teacher_role_request,
)
from studyFlax.views.admin.course_change_views import (
    request_course_change,
    my_course_change_request,
    list_course_change_requests,
    resolve_course_change_request,
)

urlpatterns = [
    path("", include(router.urls)),
    #path("hello/", hello, name="hello"),

    # Authentication
    path("auth/register/", register_view, name='auth-register'),
    path("auth/login/", login_view, name='auth-login'),
    path("auth/logout/", logout_view, name='auth-logout'),
    path("auth/password-reset/request/", reset_password_view, name='password-reset-request'),
    path("auth/password-reset/confirm/", confirm_password_reset_view, name='password-reset-confirm'),

    # User
    path("profile/", profile_view, name='user-profile'),
    path("users/<int:user_id>/profile/", another_user_profile_view, name='another-user-profile'),
    path('profile/summary/', profile_summary_view, name='profile-summary'),
    path("check-username/", check_username, name='check-username'),
    path("users/search/", user_search, name='user-search'),
    path("settings/", user_settings_view, name='user-settings'),
    path("onboarding/", onboarding_view, name='onboarding'),

    # Calendar
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("events/<int:pk>/exception/", add_exception_date, name="event-exception"),
    path("tags/", tag_list, name="tag-list"),
    path("tags/<int:pk>/", tag_detail, name="tag-detail"),
    path("categories/", category_list, name="category-list"),
    path("timetable/import/", timetable_import, name="timetable-import"),

    # Modules
    path("modules/", module_list, name="module_list"),
    path("modules/<int:module_id>/", module_detail, name="module_detail"),
    path("enrollments/", enrollment_list, name="enrollment_list"),
    path("enrollments/<int:enrollment_id>/", enrollment_detail, name="enrollment_detail"),
    path("auth/register/", register_view, name='auth-register'),
    path("auth/login/", login_view, name='auth-login'),
    path("auth/logout/", logout_view, name='auth-logout'),
    path("timetable/import/", timetable_import, name="timetable-import"),

    # Tasks
    path("tasks/", task_list, name="task-list"),
    path("tasks/<int:task_id>/", task_detail, name="task-detail"),
    path("tasks/<int:task_id>/log-time/", log_task_time, name="task-log-time"),
    path("tasks/lists/", task_list_list, name="task-list-list"),
    path("tasks/lists/<int:list_id>/", task_list_detail, name="task-list-detail"),

    # Group work
    path("group-work/projects/", group_project_list, name="group-project-list"),
    path("group-work/projects/<int:project_id>/members/", group_project_members, name="group-project-members"),
    path("group-work/projects/<int:project_id>/", group_project_detail, name="group-project-detail"),
    path(
        "group-work/projects/<int:project_id>/members/<int:membership_id>/",
        group_project_member_detail,
        name="group-project-member-detail",
    ),
    path(
        "group-work/projects/<int:project_id>/availability/",
        group_availability,
        name="group-availability",
    ),
    path(
        "group-work/projects/<int:project_id>/suggestions/",
        create_suggestion,
        name="group-suggestion-create",
    ),
    path(
        "group-work/suggestions/<int:suggestion_id>/respond/",
        respond_to_suggestion,
        name="group-suggestion-respond",
    ),
    path(
        "group-work/suggestions/<int:suggestion_id>/",
        delete_suggestion,
        name="group-suggestion-delete",
    ),

    # Attendance
    path("attendance/record/", record_attendance, name="attendance-record"),
    path("attendance/stats/", attendance_stats, name="attendance-stats"),
    path("attendance/records/", attendance_records, name="attendance-records"),

    # Notifications
    path("notifications/", notification_list, name="notification-list"),
    path("notifications/<int:pk>/", notification_detail, name="notification-detail"),
    path("notifications/mark-all-read/", mark_all_read, name="notification-mark-all-read"),
    path("notifications/clear-all/", clear_all, name="notification-clear-all"),
    path("settings/", user_settings_view, name='user-settings'),

    # Societies
    path("societies/", society_list, name="society-list"),
    path("societies/<int:society_id>/", society_detail, name="society-detail"),
    path("societies/<int:society_id>/members/", membership_list, name="society-members"),
    path("societies/<int:society_id>/members/me/", membership_detail, name="society-member-self"),
    path("societies/<int:society_id>/members/<int:user_id>/", membership_detail, name="society-member-detail"),
    path("societies/<int:society_id>/tags/", society_tag_list, name="society-tags"),
    path("societies/<int:society_id>/tags/<int:tag_id>/", society_tag_detail, name="society-tag-detail"),
    path("societies/<int:society_id>/announcements/", announcement_list, name="society-announcements"),
    path("societies/<int:society_id>/announcements/<int:announcement_id>/", announcement_detail, name="society-announcement-detail"),
    path("societies/<int:society_id>/events/", society_event_list, name="society-events"),
    path("societies/<int:society_id>/events/<int:event_id>/", society_event_detail, name="society-event-detail"),
    path("societies/<int:society_id>/events/<int:event_id>/exception/", add_society_event_exception, name="society-event-exception"),
    path("societies/<int:society_id>/report/", report_society, name="society-report"),
    path("societies/<int:society_id>/subscribe/", toggle_subscription, name="society-subscribe"),
    path("societies/<int:society_id>/calendar-sync/", sync_calendar, name="society-calendar-sync"),
    path("societies/<int:society_id>/calendar-unsync/", unsync_calendar, name="society-calendar-unsync"),
    path("societies/<int:society_id>/calendar-sync-status/", sync_status, name="society-calendar-sync-status"),
    path("societies/<int:society_id>/publish/", publish_changes, name="society-publish-changes"),
    path("societies/<int:society_id>/ratification/request/", request_ratification, name="society-ratification-request"),
    path("societies/<int:society_id>/ratification/approve/", approve_ratification, name="society-ratification-approve"),
    path("societies/<int:society_id>/ratification/reject/", reject_ratification, name="society-ratification-reject"),
    path("admin/societies/pending-ratifications/", pending_ratifications, name="pending-ratifications"),

    path("profile/", profile_view, name='user-profile'),
    path("users/<int:user_id>/profile/", another_user_profile_view, name='another-user-profile'),
    path('profile/summary/', profile_summary_view, name='profile-summary'),
    path("check-username/", check_username, name='check-username'),
    path("users/search/", user_search, name='user-search'),
    path("auth/password-reset/request/", reset_password_view, name='password-reset-request'),
    path("auth/password-reset/confirm/", confirm_password_reset_view, name='password-reset-confirm'),

    # Analytics
    path('analytics/summary/', get_analytics_summary, name='analytics-summary'),
    path('analytics/progress/', get_progress_data, name='analytics-progress'),
    path('analytics/theme-session/', log_theme_session, name='analytics-theme-session'),
    path('analytics/theme-stats/', get_theme_stats, name='analytics-theme-stats'),
    path('analytics/ai-insights/', get_ai_insights, name='analytics-ai-insights'),
    path('analytics/ai-chat/', ai_chat, name='analytics-ai-chat'),
    path('onboarding/', onboarding_view, name='onboarding'),
    path("modules/<int:module_id>/deadlines/", deadline_list, name="deadline_list"),
    path("modules/<int:module_id>/deadlines/<int:deadline_id>/", deadline_detail, name="deadline_detail"),
    path("deadlines/upcoming/", upcoming_deadlines, name="deadline_upcoming"),
    path("user/home-address/", home_address_view, name='home_address'),

    # Admin
    path("admin/users/", user_list, name='admin-user-list'),
    path("admin/users/<int:user_id>/ban/", ban_user, name='admin-ban-user'),
    path("admin/teacher-requests/", teacher_requests, name='admin-teacher-requests'),
    path("admin/teacher-requests/<int:user_id>/resolve/", resolve_teacher_request, name='admin-resolve-teacher'),
    path("admin/reported-societies/", reported_societies, name='admin-reported-societies'),
    path("admin/reports/<int:report_id>/dismiss/", dismiss_report, name='admin-dismiss-report'),
    path("admin/reports/<int:report_id>/ban/", ban_reported_society, name='admin-ban-reported-society'),
    path("request-teacher-role/", request_teacher_role, name='request-teacher-role'),
    path("cancel-teacher-role/", cancel_teacher_role_request, name='cancel-teacher-role'),

    # Course change requests
    path("course-change/request/", request_course_change, name='course-change-request'),
    path("course-change/my-request/", my_course_change_request, name='course-change-my-request'),
    path("admin/course-change-requests/", list_course_change_requests, name='admin-course-change-list'),
    path("admin/course-change-requests/<int:request_id>/resolve/", resolve_course_change_request, name='admin-course-change-resolve'),
]
