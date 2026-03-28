import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import GroupWorkIndexPage from '../../../../pages/group_work/GroupWorkIndexPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../pages/group_work/hooks/groupWorkHooks', () => ({
  getAuthHeaders: () => ({}),
  useGroupProjects: vi.fn(),
  useGroupProjectSort: vi.fn(() => ({ sortBy: 'deadline', setSortBy: vi.fn() })),
  useSelectedProjectId: vi.fn(),
}));

vi.mock('../../../../pages/group_work/components/GroupWorkDetail', () => ({
  default: () => <div data-testid="groupwork-detail" />,
}));

import { useGroupProjects, useSelectedProjectId } from '../../../../pages/group_work/hooks/groupWorkHooks';

describe('GroupWorkIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSelectedProjectId.mockReturnValue(null);
    useGroupProjects.mockReturnValue({ projects: [], setProjects: vi.fn(), loading: false });
  });

  it('shows the full-page skeleton while loading', () => {
    useGroupProjects.mockReturnValue({ projects: [], setProjects: vi.fn(), loading: true });
    render(<GroupWorkIndexPage />);
    expect(screen.getByTestId('groupwork-skeleton')).toBeTruthy();
    // Skeleton uses AppPage and renders the title even while loading.
    expect(screen.getByText('My Group Projects')).toBeTruthy();
  });
});
