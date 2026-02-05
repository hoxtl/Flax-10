from django.urls import path

#I mport the test view. Discard if needed.

from studyFlax.views.views import hello

urlpatterns = [
    path("hello/", hello),
]
