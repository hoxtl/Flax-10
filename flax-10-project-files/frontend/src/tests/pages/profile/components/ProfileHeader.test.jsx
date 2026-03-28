/**
 * ProfileHeader coverage tests (stats, badges, persona, teacher/student copy).
 */

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

describe('ProfileHeader – Part 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetProfileHelperMocks();
  });

  it('renders initials fallback when no photo is provided', () => {
    render(
      <ProfileHeader
        user={{ username: 'bob', first_name: 'Bob', last_name: 'Bell' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText('BB').length).toBeGreaterThan(0);
  });

  it('shows societies stat when societyCount > 0 and canEditProfile', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 2 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[{ id: 1 }, { id: 2 }]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.getByText('societies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\s+societies/i })).toBeInTheDocument();
  });

  it('does NOT show societies stat when canEditProfile is false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={viewerVisibility}
        societies={[{ id: 1 }, { id: 2 }]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.queryByText('societies')).not.toBeInTheDocument();
  });

  it('does NOT show societies stat when societyCount is 0', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.queryByText('societies')).not.toBeInTheDocument();
  });

  it('shared-with stat appears only when canViewSharedWith', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ shared_with_count: 3, shared_by_count: 2 }}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewSharedWith: true }}
      />,
    );
    expect(screen.getByText('shared')).toBeInTheDocument();
    expect(screen.getByText('sharing with me')).toBeInTheDocument();
  });

  it('shared-with stat is hidden when canViewSharedWith is false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ shared_with_count: 5 }}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewSharedWith: false }}
      />,
    );
    expect(screen.queryByText('shared')).not.toBeInTheDocument();
  });

  it('onSocietiesClick fires when societies stat is clicked', () => {
    const onSocietiesClick = vi.fn();
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 1 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[{ id: 1 }]}
        onSocietiesClick={onSocietiesClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /1\s+societies/i }));
    expect(onSocietiesClick).toHaveBeenCalled();
  });

  it('shows the shared planning tip when viewing someone else profile', () => {
    render(
      <ProfileHeader
        user={{ username: 'other' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={viewerVisibility}
      />,
    );
    expect(screen.getByText(/Compare free slots/i)).toBeInTheDocument();
  });

  it('joins student year and major with a middle dot in the description', () => {
    render(
      <ProfileHeader
        user={{ username: 'stu', role: 'student' }}
        profileData={{ year: 'Year 2', major: 'Physics' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText(/Year 2 · Physics/).length).toBeGreaterThan(0);
  });

  it('renders teacher description with "Department:" prefix', () => {
    render(
      <ProfileHeader
        user={{ username: 'prof', role: 'teacher' }}
        profileData={{ major: 'Mathematics' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText('Department: Mathematics').length).toBeGreaterThan(0);
  });

  it('renders teacher role when role field is "teacher"', () => {
    render(
      <ProfileHeader
        user={{ username: 'prof', first_name: 'Alan', last_name: 'Turing', role: 'teacher' }}
        profileData={{ major: 'Computing' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText('Professor').length).toBeGreaterThan(0);
  });

  it('detects professor by Dr. prefix on full name', () => {
    overrideProfileHelperMocks({
      buildFullName: () => 'Dr. Jane Smith',
    });
    render(
      <ProfileHeader
        user={{ username: 'jane' }}
        profileData={{ major: 'Biology' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText(/Professor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Department: Biology/i).length).toBeGreaterThan(0);
  });

  it('renders badge tooltip on mouse enter', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[{ id: 'b1', emoji: '🎯', label: 'Marksman', description: 'Hit target' }]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    const emojiBtn = screen.getByText('🎯').closest('button');
    fireEvent.mouseEnter(emojiBtn);
    expect(screen.getByText('Marksman')).toBeInTheDocument();
    expect(screen.getByText('Hit target')).toBeInTheDocument();
  });

  it('renders "Tap to unpin" when a badge is pinned as featured', () => {
    const badges = [
      { id: 'pinned1', emoji: '⭐', label: 'Star', description: 'Shines bright' },
      { id: 'other', emoji: '💡', label: 'Idea', description: 'Bright idea' },
    ];
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ pinned_badge_id: 'pinned1' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={badges}
        pinnedBadgeId="pinned1"
        onPinBadge={vi.fn()}
      />,
    );
    expect(screen.getByText('Tap to unpin')).toBeInTheDocument();
  });

  it('renders persona inline chip with peak label', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={{ emoji: '🦉', label: 'Night Owl', description: 'Burns midnight oil' }}
        peakHour={22}
      />,
    );
    expect(screen.getByText('Night Owl')).toBeInTheDocument();
    expect(screen.getByText('Burns midnight oil')).toBeInTheDocument();
    expect(screen.getByText('Based on your 10pm peak')).toBeInTheDocument();
  });

  it('renders persona inline chip with midnight peak (12am)', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={{ emoji: '🌑', label: 'Midnight', description: 'Deep night' }}
        peakHour={0}
      />,
    );
    expect(screen.getByText('Based on your 12am peak')).toBeInTheDocument();
  });

  it('does not render persona chip when persona is null', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={null}
        peakHour={null}
      />,
    );
    expect(screen.queryByText('Night Owl')).not.toBeInTheDocument();
  });

  it('does not render FeaturedBadgeCard when no badge is pinned', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[{ id: 'x', emoji: '💎', label: 'Diamond', description: 'Rare' }]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    expect(screen.queryByText('Tap to unpin')).not.toBeInTheDocument();
    expect(screen.getByText('💎')).toBeInTheDocument();
  });

  it('hides mobile stats row when modules are not visible to the viewer', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewModules: false }}
      />,
    );
    expect(screen.queryByText('Modules')).not.toBeInTheDocument();
  });

  it('shows the mobile shared-calendar pill when viewing another user shared calendar', () => {
    render(
      <ProfileHeader
        user={{ username: 'bob' }}
        profileData={{ is_shared_with_me: true }}
        handlers={baseHandlers}
        visibility={viewerVisibility}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Shared calendar with me').length).toBeGreaterThan(0);
  });

  it('hides persona and badge rows for viewers with no insights content', () => {
    render(
      <ProfileHeader
        user={{ username: 'viewer' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={viewerVisibility}
        badges={[]}
        persona={null}
      />,
    );
    expect(screen.queryByText(/Earn badges/i)).not.toBeInTheDocument();
  });

  it('shows the empty insights placeholder when the owner has no badges or persona', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[]}
        persona={null}
      />,
    );
    expect(screen.getByText(/Earn badges by building study habits/i)).toBeInTheDocument();
  });

  it('renders View All and calls onViewAllBadges when clicked', () => {
    const onViewAllBadges = vi.fn();
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[
          { id: 'a', emoji: '🥇', label: 'Gold', description: 'd' },
          { id: 'b', emoji: '🥈', label: 'Silver', description: 'd' },
        ]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
        onViewAllBadges={onViewAllBadges}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    expect(onViewAllBadges).toHaveBeenCalled();
  });
});
