from rest_framework.routers import DefaultRouter
from studyFlax.views.taskViews import TaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")

urlpatterns = router.urls
