"""
URL configuration for the backend project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import Http404, HttpResponse
from django.urls import include, path, re_path
from django.views.static import serve


FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"


def frontend_index(request):
    """Serve the built React app so client-side routes work on refresh."""
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.exists():
        raise Http404("Frontend build not found. Run `npm run build` in frontend/.")
    return HttpResponse(index_file.read_bytes(), content_type="text/html")


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("studyFlax.urls.api_urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve the built React frontend (production / Docker image)
urlpatterns += [
    re_path(r"^(?!api/|admin/|media/|static/)(?P<path>.+\.[A-Za-z0-9]+)$", serve, {"document_root": FRONTEND_DIST}),
    re_path(r"^(?!api/|admin/|media/|static/).*$", frontend_index),
]
