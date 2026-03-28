import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/group_work/GroupWorkIndexPage.test.jsx
import GroupWorkIndexPage, { getMostUrgentProject, prependProject } from '../../../pages/group_work/GroupWorkIndexPage';
=======
import GroupWorkIndexPage from '../../../../pages/group_work/GroupWorkIndexPage';
>>>>>>> origin:flax-10-project-files/frontend/src/tests/pages/group_work/components/GroupWorkIndexPage.test.jsx

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

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/group_work/GroupWorkIndexPage.test.jsx
vi.mock('../../../pages/group_work/utils/projectRowUtils', () => ({
  getProjectDate: vi.fn((deadline) => deadline),
  getDaysLeft: vi.fn(() => 5),
}));

vi.mock('../../../pages/group_work/components/GroupWorkDetail', () => ({
  default: () => <div data-testid="groupwork-detail" />,
}));

import { useGroupProjects, useSelectedProjectId } from '../../../pages/group_work/hooks/groupWorkHooks';
import { getProjectDate, getDaysLeft } from '../../../pages/group_work/utils/projectRowUtils';
=======
vi.mock('../../../../pages/group_work/components/GroupWorkDetail', () => ({
  default: () => <div data-testid="groupwork-detail" />,
}));

import { useGroupProjects, useSelectedProjectId } from '../../../../pages/group_work/hooks/groupWorkHooks';
>>>>>>> origin:flax-10-project-files/frontend/src/tests/pages/group_work/components/GroupWorkIndexPage.test.jsx

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

describe('GroupWorkIndexPage helpers', () => {
  beforeEach(() => {
    getProjectDate.mockImplementation((deadline) => deadline);
    getDaysLeft.mockImplementation(() => 5);
  });

  it('getMostUrgentProject handles undefined inputs', () => {
    expect(getMostUrgentProject()).toBeNull();
  });

  it('getMostUrgentProject ranks projects by soonest days left', () => {
    const soon = { id: 2, deadline: 'soon' };
    const later = { id: 3, deadline: 'later' };
    getDaysLeft.mockImplementation((value) => (value === 'soon' ? 1 : 6));

    const result = getMostUrgentProject([later, soon]);

    expect(result.project).toBe(soon);
    expect(result.daysLeft).toBe(1);
  });

  it('prependProject inserts new projects at the top of the list', () => {
    let projects = [{ id: 1 }, { id: 3 }];
    const setProjects = vi.fn((updater) => {
      projects = updater(projects);
    });

    const newProject = { id: 9 };
    prependProject(newProject, setProjects);

    expect(projects[0]).toBe(newProject);
    expect(projects.slice(1)).toEqual([{ id: 1 }, { id: 3 }]);
    expect(setProjects).toHaveBeenCalledTimes(1);
  });
});
