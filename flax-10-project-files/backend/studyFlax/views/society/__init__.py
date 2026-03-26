"""Society views package."""

from .society_view import society_list, publish_changes
from .society_detail_view import society_detail, report_society
from .membership_view import membership_list, membership_detail, toggle_subscription
from .society_tag_view import society_tag_list, society_tag_detail
from .society_announcement_view import announcement_list, announcement_detail
from .society_event_view import event_list, event_detail, add_society_event_exception
from .calendar_sync_view import sync_status, sync_calendar, unsync_calendar
from .ratification_view import (
    request_ratification, approve_ratification, reject_ratification, pending_ratifications
)


_ = (
    society_list,
    publish_changes,
    society_detail,
    report_society,
    membership_list,
    membership_detail,
    toggle_subscription,
    society_tag_list,
    society_tag_detail,
    announcement_list,
    announcement_detail,
    event_list,
    event_detail,
    add_society_event_exception,
    sync_status,
    sync_calendar,
    unsync_calendar,
    request_ratification,
    approve_ratification,
    reject_ratification,
    pending_ratifications,
)
