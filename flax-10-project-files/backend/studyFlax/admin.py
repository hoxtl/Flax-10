"""
Django admin registrations for society and user models.
"""

from django.contrib import admin
from studyFlax.models.society import (
    Society, SocietyMembership, SocietyTag, SocietyImage,
    SocietyAnnouncement, SocietyAnnouncementImage, SocietyEvent, SocietyReport
)
from django.contrib.auth import get_user_model


User = get_user_model()
admin.site.register(User)
admin.site.register(Society)
admin.site.register(SocietyMembership)
admin.site.register(SocietyTag)
admin.site.register(SocietyImage)
admin.site.register(SocietyAnnouncement)
admin.site.register(SocietyAnnouncementImage)
admin.site.register(SocietyEvent)

class SocietyReportInline(admin.TabularInline):
    """Inline admin for society report."""
    model = SocietyReport
    extra = 0
    readonly_fields = ('reporter', 'reason', 'created_at')
    can_delete = True

class ReportedSociety(Society):
    """Proxy model for societies with active reports."""
    class Meta:
        """Metadata for reported society."""
        proxy = True
        verbose_name = 'Society Report'
        verbose_name_plural = 'Society Reports'

class ReportedSocietyAdmin(admin.ModelAdmin):
    """Admin for reported society."""
    inlines = [SocietyReportInline]
    list_display = ('name', 'is_ratified', 'report_count')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(reports__isnull=False).distinct()

    def report_count(self, obj):
        return obj.reports.count()
    report_count.short_description = 'Total Reports'

admin.site.register(ReportedSociety, ReportedSocietyAdmin)
