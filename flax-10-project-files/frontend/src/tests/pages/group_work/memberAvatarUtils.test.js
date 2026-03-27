import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MEMBER_PALETTE,
  getInitials,
  getDisplayName,
  getMemberKey,
  buildMemberColorMap,
  getMemberColor,
  getPhotoUrl,
  getProfileNavTarget,
  openMemberProfile,
  getStoredViewer,
  getCurrentMember,
} from '../../../pages/group_work/utils/memberAvatarUtils';
import { getResolvedUserPhoto } from '../../../utils/tutorPhotoFallback.js';

vi.mock('../../../utils/tutorPhotoFallback.js', () => ({
  getResolvedUserPhoto: vi.fn(() => 'https://example.com/photo.jpg'),
}));

describe('memberAvatarUtils – MEMBER_PALETTE', () => {
  it('is an array of colour strings', () => {
    expect(Array.isArray(MEMBER_PALETTE)).toBe(true);
    expect(MEMBER_PALETTE.length).toBeGreaterThan(0);
  });
});

describe('memberAvatarUtils – getInitials', () => {
  it('returns initials from first_name and last_name', () => {
    expect(getInitials({ first_name: 'Alice', last_name: 'Brown' })).toBe('AB');
  });

  it('returns initials from user_name when names are absent', () => {
    expect(getInitials({ user_name: 'john doe' })).toBe('JD');
  });

  it('returns single character initial when only one name part', () => {
    expect(getInitials({ user_name: 'alice' })).toBe('A');
  });

  it('returns ? when member has no usable name', () => {
    expect(getInitials({})).toBe('?');
  });
});

describe('memberAvatarUtils – getDisplayName', () => {
  it('prefers first_name + last_name', () => {
    expect(getDisplayName({ first_name: 'Alice', last_name: 'Brown' })).toBe('Alice Brown');
  });

  it('falls back to user_name', () => {
    expect(getDisplayName({ user_name: 'alice_b' })).toBe('alice_b');
  });

  it('falls back to name and then an empty string', () => {
    expect(getDisplayName({ name: 'Alice Brown' })).toBe('Alice Brown');
    expect(getDisplayName({})).toBe('');
  });
});

describe('memberAvatarUtils – getMemberKey', () => {
  it('uses user field first', () => {
    expect(getMemberKey({ user: 5, id: 9 })).toBe('5');
  });

  it('falls back to id when user is absent', () => {
    expect(getMemberKey({ id: 9 })).toBe('9');
  });

  it('falls back through username fields and handles missing values', () => {
    expect(getMemberKey({ user_name: 'alice' })).toBe('alice');
    expect(getMemberKey({ username: 'bob' })).toBe('bob');
    expect(getMemberKey({ name: 'Chris' })).toBe('Chris');
    expect(getMemberKey({})).toBe('');
  });
});

describe('memberAvatarUtils – buildMemberColorMap', () => {
  it('assigns distinct colours to distinct members', () => {
    const members = [{ user: 1 }, { user: 2 }];
    const map = buildMemberColorMap(members);
    expect(map['1']).not.toBe(map['2']);
  });

  it('skips duplicate and empty member keys', () => {
    const map = buildMemberColorMap([{ user: 1 }, { user: 1 }, {}, { id: 2 }]);
    expect(map).toEqual({
      '1': MEMBER_PALETTE[0],
      '2': MEMBER_PALETTE[1],
    });
  });
});

describe('memberAvatarUtils – getMemberColor', () => {
  it('returns a palette colour string', () => {
    const members = [{ user: 1 }];
    const colour = getMemberColor({ user: 1 }, members);
    expect(MEMBER_PALETTE).toContain(colour);
  });

  it('falls back to the first palette entry when the member has no key or is missing from the map', () => {
    expect(getMemberColor({}, [{ user: 1 }])).toBe(MEMBER_PALETTE[0]);
    expect(getMemberColor({ user: 99 }, [{ user: 1 }])).toBe(MEMBER_PALETTE[0]);
  });
});

describe('memberAvatarUtils – getPhotoUrl', () => {
  it('passes normalized member data to the tutor photo fallback helper', () => {
    const member = {
      user: 7,
      user_name: 'ava',
      first_name: 'Ava',
      last_name: 'Stone',
      role: 'lead',
      profile_photo_url: '/avatar.png',
      profile_photo: '/avatar-full.png',
      avatar: '/avatar-fallback.png',
    };

    expect(getPhotoUrl(member)).toBe('https://example.com/photo.jpg');
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        username: 'ava',
        first_name: 'Ava',
        last_name: 'Stone',
        name: 'Ava Stone',
        role: 'lead',
        profile_photo_url: '/avatar.png',
        profile_photo: '/avatar-full.png',
        avatar: '/avatar-fallback.png',
      }),
      { seed: 'ava', allowGeneric: true },
    );
  });
});

describe('memberAvatarUtils – getProfileNavTarget', () => {
  it('returns profile_{id} when user field is present', () => {
    expect(getProfileNavTarget({ user: 3 })).toBe('profile_3');
  });

  it('returns null when no ID field is present', () => {
    expect(getProfileNavTarget({})).toBeNull();
  });
});

describe('memberAvatarUtils – openMemberProfile', () => {
  let dispatched;

  beforeEach(() => {
    dispatched = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => dispatched.push(e));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches a navigate event with the correct detail', () => {
    openMemberProfile({ stopPropagation: vi.fn() }, { user: 5 });
    expect(dispatched[0].detail).toBe('profile_5');
  });

  it('does nothing when there is no profile target', () => {
    openMemberProfile(null, {});
    expect(dispatched).toEqual([]);
  });
});

describe('memberAvatarUtils – getStoredViewer', () => {
  it('returns empty object when localStorage has no user', () => {
    window.localStorage.clear();
    expect(getStoredViewer()).toEqual({});
  });

  it('returns parsed user when localStorage has a user', () => {
    window.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
    expect(getStoredViewer()).toEqual({ id: 1, username: 'alice' });
  });

  it('returns empty object for invalid localStorage JSON', () => {
    window.localStorage.setItem('user', '{bad json');
    expect(getStoredViewer()).toEqual({});
  });
});

describe('memberAvatarUtils – getCurrentMember', () => {
  it('returns the member matching the stored viewer id', () => {
    window.localStorage.setItem('user', JSON.stringify({ id: 2 }));
    expect(getCurrentMember([{ user: 1 }, { user: 2, name: 'Ava' }])).toEqual({ user: 2, name: 'Ava' });
  });

  it('returns null when there is no stored viewer id or no match', () => {
    window.localStorage.setItem('user', JSON.stringify({}));
    expect(getCurrentMember([{ user: 1 }])).toBeNull();

    window.localStorage.setItem('user', JSON.stringify({ id: 9 }));
    expect(getCurrentMember([{ user: 1 }])).toBeNull();
  });
});

describe('tutorPhotoFallback – getResolvedUserPhoto', () => {
  it('calls the mocked function', () => {
    const photo = getResolvedUserPhoto({});
    expect(photo).toBe('https://example.com/photo.jpg');
    expect(getResolvedUserPhoto).toHaveBeenCalled();
  });
});
