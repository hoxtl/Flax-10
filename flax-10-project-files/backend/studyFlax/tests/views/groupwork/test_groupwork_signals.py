"""
Tests for groupwork signals.
"""

from studyFlax.models.groupwork.groupwork_model import (
    GroupMembership,
    GroupProject,
)
from studyFlax.models.notifications.notification_model import Notification
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user


class GroupworkSignalTests(BaseTestCase):
    """Tests groupwork signal."""
    def test_member_added_creates_notification(self):
        project = GroupProject.objects.create(name="Signals", owner=self.user)
        GroupMembership.objects.create(project=project, user=self.user, role="owner")
        member = make_user("member", "member@e.com")
        initial_count = Notification.objects.filter(user=member).count()
        GroupMembership.objects.create(project=project, user=member, role="member")
        self.assertEqual(
            Notification.objects.filter(user=member).count(), initial_count + 1
        )

    def test_owner_membership_does_not_create_notification(self):
        project = GroupProject.objects.create(name="Signals2", owner=self.user)
        initial = Notification.objects.filter(user=self.user).count()
        GroupMembership.objects.create(project=project, user=self.user, role="owner")
        self.assertEqual(Notification.objects.filter(user=self.user).count(), initial)

    def test_update_membership_does_not_create_notification(self):
        project = GroupProject.objects.create(name="Signals3", owner=self.user)
        member = make_user("member2", "member2@e.com")
        GroupMembership.objects.create(project=project, user=member, role="member")
        initial = Notification.objects.filter(user=member).count()
        m = GroupMembership.objects.get(project=project, user=member)
        m.role = "member"
        m.save()
        self.assertEqual(Notification.objects.filter(user=member).count(), initial)
