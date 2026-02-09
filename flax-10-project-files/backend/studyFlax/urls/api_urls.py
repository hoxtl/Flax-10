from django.urls import path, include
from rest_framework.routers import DefaultRouter
from studyFlax.views.tasks.taskViews import TaskViewSet
router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")
from studyFlax.views.calendar.event_views import event_list
from studyFlax.views.calendar.event_detail_views import event_detail, add_exception_date
from studyFlax.views.calendar.tag_views import tag_list, category_list
from studyFlax.views.hello import hello
from studyFlax.views.modules.module_views import module_list, module_detail
from studyFlax.views.modules.enrollment_views import enrollment_list, enrollment_detail

urlpatterns = [
    path("", include(router.urls)),
    path("hello/", hello, name="hello"),
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("events/<int:pk>/exception/", add_exception_date, name="event-exception"),
    path("tags/", tag_list, name="tag-list"),
    path("categories/", category_list, name="category-list"),
    path("modules/", module_list, name="module_list"),
    path("modules/<int:module_id>/", module_detail, name="module_detail"),
    path("enrollments/", enrollment_list, name="enrollment_list"),
    path("enrollments/<int:enrollment_id>/", enrollment_detail, name="enrollment_detail")
]
