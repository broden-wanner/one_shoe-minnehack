from django.urls import path
from rest_framework import routers
from voter.api import LocationViewSet

router = routers.DefaultRouter()
router.register('locations', LocationViewSet, 'locations')

urlpatterns = router.urls
