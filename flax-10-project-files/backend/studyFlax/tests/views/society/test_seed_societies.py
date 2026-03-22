from django.contrib.auth import get_user_model
from django.test import TestCase

from studyFlax.management.commands.seed_societies import _ensure_seed_membership
from studyFlax.models.society import SocietyCalendarSync, SocietyMembership
from studyFlax.tests.helpers.factories import make_society

User = get_user_model()


class SeedSocietyMembershipDefaultsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="seed_society_member",
            email="seed_society_member@example.com",
            password="pass",
        )
        self.society = make_society("Seed Society")

    def test_seed_membership_turns_on_notifications_and_calendar_sync(self):
        membership = _ensure_seed_membership(self.user, self.society, "member")

        self.assertEqual(membership.role, "member")
        self.assertTrue(membership.is_subscribed)
        self.assertTrue(
            SocietyCalendarSync.objects.filter(user=self.user, society=self.society).exists()
        )

    def test_seed_membership_updates_existing_membership_defaults(self):
        SocietyMembership.objects.create(
            user=self.user,
            society=self.society,
            role="member",
            is_subscribed=False,
        )

        membership = _ensure_seed_membership(self.user, self.society, "admin")

        self.assertEqual(membership.role, "admin")
        self.assertTrue(membership.is_subscribed)
        self.assertEqual(
            SocietyCalendarSync.objects.filter(user=self.user, society=self.society).count(),
            1,
        )
