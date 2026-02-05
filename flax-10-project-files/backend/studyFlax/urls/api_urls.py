from django.urls import path

#Import the test view. Discard if needed.

from studyFlax.views.views import hello
from studyFlax.views.event_views import event_list
from studyFlax.views.event_detail_views import event_detail
from studyFlax.views.tag_views import tag_list, category_list

urlpatterns = [
    path("hello/", hello, name="hello"),
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("tags/", tag_list, name="tag-list"),
    path("categories/", category_list, name="category-list"),
]
