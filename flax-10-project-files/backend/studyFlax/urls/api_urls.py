from django.urls import path

#Import the test view. Discard if needed.

from studyFlax.views.views import hello

urlpatterns = [
    path("hello/", hello),
]
