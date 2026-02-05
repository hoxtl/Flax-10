from rest_framework.response import Response
from rest_framework.decorators import api_view

# DRF API endpoint response example. React get a json in respond

@api_view(["GET"])
def hello(request):
    return Response({"message": "Hello from Django REST Framework"})
