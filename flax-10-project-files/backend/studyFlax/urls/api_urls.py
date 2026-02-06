from django.urls import path, include
from rest_framework.routers import DefaultRouter
from studyFlax.views.taskViews import TaskViewSet
router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")
from studyFlax.views.event_views import event_list
from studyFlax.views.event_detail_views import event_detail
from studyFlax.views.tag_views import tag_list, category_list

urlpatterns = [
    path("", include(router.urls)),
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("tags/", tag_list, name="tag-list"),
    path("categories/", category_list, name="category-list"),
]
