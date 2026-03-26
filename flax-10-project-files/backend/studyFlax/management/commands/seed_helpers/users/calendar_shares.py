"""
Seeds calendar sharing relationships for fixture and generated users.
"""

import random

from studyFlax.models import CalendarShare


def _initial_share_pairs(users, rng):
    """Build initial round-robin share pairs."""
    shuffled = users[:]
    rng.shuffle(shuffled)
    return {(owner.id, shuffled[(index + 1) % len(shuffled)].id) for index, owner in enumerate(shuffled)}

def _find_new_pairs(owner_id, candidates, planned_pairs, limit):
    """Find new share pairs that are not already planned."""
    new_pairs = [(owner_id, target.id) for target in candidates if (owner_id, target.id) not in planned_pairs]
    return new_pairs[:limit]

def _add_extra_pairs_for_owner(owner, users, rng, planned_pairs):
    """Add extra random share pairs for one owner."""
    candidates = [target for target in users if target.id != owner.id]
    rng.shuffle(candidates)
    target_count = rng.randint(0, min(3, len(candidates) - 1))
    planned_pairs.update(_find_new_pairs(owner.id, candidates, planned_pairs, target_count))

def build_calendar_share_pairs(users):
    rng = random.Random("studyflax-calendar-shares")
    planned_pairs = _initial_share_pairs(users, rng)
    for owner in users:
        _add_extra_pairs_for_owner(owner, users, rng, planned_pairs)
    return planned_pairs

def _create_share_if_valid(owner, target):
    """Create a share if both users exist."""
    if not (owner and target):
        return 0
    _, was_created = CalendarShare.objects.get_or_create(owner=owner, shared_with=target)
    return int(was_created)

def create_calendar_shares(users, planned_pairs):
    """Create CalendarShare rows from planned pairs."""
    user_by_id = {user.id: user for user in users}
    pairs_with_users = [(user_by_id.get(owner_id), user_by_id.get(target_id)) for owner_id, target_id in sorted(planned_pairs)]
    return sum(_create_share_if_valid(owner, target) for owner, target in pairs_with_users)

def _seed_inbound_for_fixture(target, all_users):
    """Seed inbound calendar shares for one fixture user."""
    rng = random.Random(f"studyflax-{target.username}-shares-v2")
    potential = [user for user in all_users if user.username != target.username]
    shuffled = potential[:]
    rng.shuffle(shuffled)
    non_sharers = {user.username for user in shuffled[:5]}
    sharers = [user for user in potential if user.username not in non_sharers]
    for sharer in sharers:
        CalendarShare.objects.get_or_create(owner=sharer, shared_with=target)

def _seed_outbound_for_fixture(owner, all_users):
    """Seed outbound calendar shares for one fixture user."""
    rng = random.Random(f"studyflax-{owner.username}-outbound-v1")
    potential = [user for user in all_users if user.username != owner.username]
    shuffled = potential[:]
    rng.shuffle(shuffled)
    for viewer in shuffled[:len(shuffled) // 2]:
        CalendarShare.objects.get_or_create(owner=owner, shared_with=viewer)

def _seed_viewer_shares_for_user(user, all_users):
    """Seed a handful of viewers for one non-fixture user."""
    rng = random.Random(f"studyflax-{user.username}-viewers-v1")
    pool = [viewer for viewer in all_users if viewer.username != user.username]
    rng.shuffle(pool)
    for viewer in pool[:5]:
        CalendarShare.objects.get_or_create(owner=user, shared_with=viewer)

def seed_shares_with_fixtures(all_users, fixture_names):
    fixture_users = {user.username: user for user in all_users if user.username in fixture_names}
    non_fixture = [user for user in all_users if user.username not in fixture_names]
    for target in fixture_users.values():
        _seed_inbound_for_fixture(target, all_users)
    for owner in fixture_users.values():
        _seed_outbound_for_fixture(owner, all_users)
    for user in non_fixture:
        _seed_viewer_shares_for_user(user, all_users)
