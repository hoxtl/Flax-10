from django.urls import path, include
from rest_framework.routers import DefaultRouter
from studyFlax.views.tasks.taskViews import TaskViewSet
router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")
from studyFlax.views.calendar.event_views import event_list
from studyFlax.views.calendar.event_detail_views import event_detail, add_exception_date
from studyFlax.views.calendar.tag_views import tag_list, category_list
from studyFlax.views.hello import hello
from studyFlax.views.authentication.register_view import register_view
from studyFlax.views.authentication.login_view import login_view
from studyFlax.views.authentication.logout_view import logout_view

urlpatterns = [
    path("", include(router.urls)),
    path("hello/", hello, name="hello"),
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("events/<int:pk>/exception/", add_exception_date, name="event-exception"),
    path("tags/", tag_list, name="tag-list"),
    path("categories/", category_list, name="category-list"),
    path("auth/register/", register_view, name='auth-register'),
    path("auth/login/", login_view, name='auth-login'),
    path("auth/logout/", logout_view, name='auth-logout'),
]
