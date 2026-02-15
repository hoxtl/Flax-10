from django.contrib import admin
from studyFlax.models.society import (
    Society, SocietyMembership, SocietyTag, SocietyImage,
    SocietyAnnouncement, SocietyAnnouncementImage, SocietyEvent
)

admin.site.register(Society)
admin.site.register(SocietyMembership)
admin.site.register(SocietyTag)
admin.site.register(SocietyImage)
admin.site.register(SocietyAnnouncement)
admin.site.register(SocietyAnnouncementImage)
admin.site.register(SocietyEvent)
