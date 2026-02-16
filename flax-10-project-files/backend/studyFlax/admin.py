from django.contrib import admin
from studyFlax.models.society import (
    Society, SocietyMembership, SocietyTag, SocietyImage,
    SocietyAnnouncement, SocietyAnnouncementImage, SocietyEvent
)
from django.contrib.auth import get_user_model

# Register your models here.
User = get_user_model()
admin.site.register(User)
admin.site.register(Society)
admin.site.register(SocietyMembership)
admin.site.register(SocietyTag)
admin.site.register(SocietyImage)
admin.site.register(SocietyAnnouncement)
admin.site.register(SocietyAnnouncementImage)
admin.site.register(SocietyEvent)


