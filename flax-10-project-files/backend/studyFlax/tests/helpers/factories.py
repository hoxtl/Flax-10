"""
Shared test factory functions for creating common model instances.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

User = get_user_model()

def make_user(username='testuser', email=None, password='pass', is_active=True):
    email = email or f'{username}@example.com'
    return User.objects.create_user(
        username=username, email=email, password=password, is_active=is_active,
    )

def make_superuser(username='admin', email=None, password='adminpass'):
    email = email or f'{username}@example.com'
    return User.objects.create_superuser(
        username=username, email=email, password=password,
        is_staff=True, is_superuser=True,
    )

def authed_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

def make_society(name='Test Society'):
    from studyFlax.models.society import Society
    return Society.objects.create(name=name, bio='Test', admin_emails='admin@test.com')

def make_society_admin(user, society):
    from studyFlax.models.society import SocietyMembership
    return SocietyMembership.objects.create(user=user, society=society, role='admin')

def make_society_member(user, society):
    from studyFlax.models.society import SocietyMembership
    return SocietyMembership.objects.create(user=user, society=society, role='member')

def make_society_event(society, title='Test Event', recurrence='none'):
    from studyFlax.models.society import SocietyEvent
    return SocietyEvent.objects.create(
        society=society, title=title, recurrence=recurrence,
        start_time=timezone.now() + timedelta(days=1),
        end_time=timezone.now() + timedelta(days=1, hours=2),
    )

def make_announcement(society, title='Announcement', content='Content'):
    from studyFlax.models.society import SocietyAnnouncement
    return SocietyAnnouncement.objects.create(society=society, title=title, content=content)

def make_session(user, duration=60, break_duration=10, pause_duration=0, status_val='Completed', hours_ago=1):
    from studyFlax.models.timer.sessionModel import StudySession
    end = timezone.now() - timedelta(hours=hours_ago)
    start = end - timedelta(minutes=duration)
    return StudySession.objects.create(
        user=user, start_time=start, end_time=end,
        duration=duration, break_duration=break_duration,
        pause_duration=pause_duration, status=status_val,
        study_block_id=random.randint(1, 999999), session_count=1,
    )

def make_task_list(user, name='My List', category='personal', archived=False):
    from studyFlax.models.tasks.taskModel import TaskList
    return TaskList.objects.create(user=user, name=name, category=category, archived=archived)

def make_task(user, title='Test Task', task_list=None, priority='medium',
              completed=False, due_date=None, estimated_blocks=None):
    from studyFlax.models.tasks.taskModel import Task
    return Task.objects.create(
        user=user, title=title, task_list=task_list,
        priority=priority, completed=completed,
        due_date=due_date, estimated_blocks=estimated_blocks,
    )

def make_module(module_code, module_name, creator):
    from studyFlax.models.modules.moduleModel import Module
    now = timezone.now()
    return Module.objects.create(
        module_code=module_code, module_name=module_name,
        created_by=creator, start_time=now, end_time=now + timedelta(hours=1),
    )
