from django.urls import path, include
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
from studyFlax.views.calendar.event_views import event_list
from studyFlax.views.calendar.event_detail_views import event_detail, add_exception_date
from studyFlax.views.calendar.tag_views import tag_list, tag_detail, category_list
from studyFlax.views.calendar.timetable_views import timetable_import
from studyFlax.views.hello import hello
from studyFlax.views.authentication.register_view import register_view
from studyFlax.views.authentication.login_view import login_view
from studyFlax.views.authentication.logout_view import logout_view
from studyFlax.views.notifications import notification_list, notification_detail, mark_all_read, clear_all
from studyFlax.views.settings.user_settings_view import user_settings_view
from studyFlax.views.society import (
    society_list, society_detail, membership_list, membership_detail,
    society_tag_list, society_tag_detail, announcement_list, announcement_detail,
    event_list as society_event_list, event_detail as society_event_detail
)

urlpatterns = [
    path("", include(router.urls)),
    path("hello/", hello, name="hello"),
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("events/<int:pk>/exception/", add_exception_date, name="event-exception"),
    path("tags/", tag_list, name="tag-list"),
    path("tags/<int:pk>/", tag_detail, name="tag-detail"),
    path("categories/", category_list, name="category-list"),
    path("auth/register/", register_view, name='auth-register'),
    path("auth/login/", login_view, name='auth-login'),
    path("auth/logout/", logout_view, name='auth-logout'),
    path("timetable/import/", timetable_import, name="timetable-import"),
    path("notifications/", notification_list, name="notification-list"),
    path("notifications/<int:pk>/", notification_detail, name="notification-detail"),
    path("notifications/mark-all-read/", mark_all_read, name="notification-mark-all-read"),
    path("notifications/clear-all/", clear_all, name="notification-clear-all"),
    path("settings/", user_settings_view, name='user-settings'),
    # Society endpoints
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
]
