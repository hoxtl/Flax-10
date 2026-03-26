"""
Signal handlers loaded when the app starts.
"""

from . import society_notifications  # noqa
from . import ratification_notifications  # noqa
from . import groupwork_notifications  # noqa


_ = (society_notifications, ratification_notifications, groupwork_notifications)
