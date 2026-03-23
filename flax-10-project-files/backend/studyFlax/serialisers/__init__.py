"""
Public re-exports for the serialisers package.
"""

from .calendar.event_serialisers import CalendarEventSerialiser, CalendarEventCreateSerialiser
from .calendar.tag_serialisers import TagSerialiser, CategorySerialiser
from .calendar.deadline_serialisers import DeadlineSerialiser
from .modules.module_serialisers import ModuleSerialiser
from .modules.enrollment_serialisers import EnrollmentSerialiser
from .auth.auth_serialisers import RegistrationUserSerialiser, UserSerialiser, LoggedUserSerialiser
from .notifications.notification_serialisers import NotificationSerialiser
from .society.society_serialisers import (
    SocietyListSerialiser, SocietyDetailSerialiser, SocietyMembershipSerialiser,
    SocietyTagSerialiser, SocietyAnnouncementSerialiser, SocietyEventSerialiser,
    SocietyEventCalendarSerialiser, get_society_color
)
from .schedule_serialiser import (
    ScheduleSerialiser,
    AutoScheduleRequestSerialiser,
    ScheduleEventAllocationSerialiser,
)

_ = (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser,
    TagSerialiser,
    CategorySerialiser,
    DeadlineSerialiser,
    ModuleSerialiser,
    EnrollmentSerialiser,
    RegistrationUserSerialiser,
    UserSerialiser,
    LoggedUserSerialiser,
    NotificationSerialiser,
    SocietyListSerialiser,
    SocietyDetailSerialiser,
    SocietyMembershipSerialiser,
    SocietyTagSerialiser,
    SocietyAnnouncementSerialiser,
    SocietyEventSerialiser,
    SocietyEventCalendarSerialiser,
    get_society_color,
    ScheduleSerialiser,
    AutoScheduleRequestSerialiser,
    ScheduleEventAllocationSerialiser,
)
