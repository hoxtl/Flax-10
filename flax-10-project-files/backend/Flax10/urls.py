"""
URL configuration for the backend project.
"""

from django.contrib import admin
from django.urls import path, include, re_path


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("studyFlax.urls.api_urls")),
    re_path(r"^(?!api/|admin/|static/|media/).*$",
        TemplateView.as_view(template_name="index.html"),
        name="spa"
    ),
]

# Serve media files in development
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
