import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  mockFramerMotion,
  mockProfileHelpers,
  mockSocialComponents,
  mockTutorPhotoFallback,
  baseHandlers,
  editableVisibility,
  viewerVisibility,
  overrideProfileHelperMocks,
  resetProfileHelperMocks,
} from './ProfileTestUtils';

mockFramerMotion();
mockProfileHelpers();
mockSocialComponents();
mockTutorPhotoFallback();

import ProfileHeader from '../../../../pages/profile/components/ProfileHeader';

const sharedViewerVisibility = { ...viewerVisibility, canEditProfile: false };

describe('ProfileHeader routes and tooltips', () => {
  beforeEach(() => {
    overrideProfileHelperMocks({ buildFullName: (user) => user?.name ?? '' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetProfileHelperMocks();
  });

  it('uses username fallback for shared calendar route', () => {
    const onNavigate = vi.fn();
    render(
      <ProfileHeader
        user={{ id: 5, username: 'owner' }}
        profileData={{ id: 88, name: '', username: 'monroe', is_shared_with_me: true }}
        handlers={baseHandlers}
        visibility={sharedViewerVisibility}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByText('View their calendar'));
    expect(onNavigate).toHaveBeenCalledWith(expect.stringMatching(/shared_name=monroe/));
  });

  it('falls back to "Shared user" when full name and username are missing', () => {
    const onNavigate = vi.fn();
    render(
      <ProfileHeader
        user={{ id: 7, username: 'owner' }}
        profileData={{ id: 77, name: '', username: '', is_shared_with_me: true }}
        handlers={baseHandlers}
        visibility={sharedViewerVisibility}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByText('View their calendar'));
    expect(onNavigate).toHaveBeenCalledWith(expect.stringMatching(/shared_name=Shared(\+|%20)user/));
  });

});
