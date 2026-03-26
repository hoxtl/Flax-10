"""
Compatibility exports for admin views.
"""

from studyFlax.views.admin.reported_society_view import (
    ban_reported_society,
    dismiss_report,
    reported_societies,
)
from studyFlax.views.admin.user_management_view import ban_user, user_list


_ = (
    ban_reported_society,
    dismiss_report,
    reported_societies,
    ban_user,
    user_list,
)
