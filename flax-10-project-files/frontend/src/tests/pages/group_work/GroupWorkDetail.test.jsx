import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import GroupProjectDetail from '../../../pages/group_work/components/GroupWorkDetail';

vi.mock('../../../pages/group_work/hooks/groupWorkHooks', () => ({
  useProjectDetail: vi.fn(),
}));

vi.mock('../../../pages/group_work/components/ProjectHeader', () => ({
  default: ({ project }) => <div data-testid="project-header">{project.name}</div>,
}));

vi.mock('../../../pages/group_work/components/TabsSection', () => ({
  default: ({ activeTab }) => <div data-testid="tabs-section">{activeTab}</div>,
}));

import { useProjectDetail } from '../../../pages/group_work/hooks/groupWorkHooks';

const detailState = {
  loading: false,
  project: { id: 1, name: 'Detailed Project' },
  members: [
    { id: 101, user_name: 'Owner User' },
    { id: 102, user_name: 'Member User' },
  ],
  patchProject: vi.fn(),
  taskStats: { percent: 0, completed: 0, total: 0, segments: [] },
  handleDeleteProject: vi.fn(),
  handleRemoveMember: vi.fn(),
  onAdded: vi.fn(),
  activeTab: 'tasks',
  setActiveTab: vi.fn(),
  setTaskStats: vi.fn(),
};

function renderComponent(props = {}) {
  return render(<GroupProjectDetail projectId={1} onBack={vi.fn()} {...props} />);
}

describe('GroupWorkDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectDetail.mockReturnValue(detailState);
  });

  it('renders the project detail sections', () => {
    renderComponent();
    expect(screen.getByTestId('project-header')).toHaveTextContent('Detailed Project');
    expect(screen.getByTestId('tabs-section')).toHaveTextContent('tasks');
  });

  it('shows the skeleton while loading', () => {
    useProjectDetail.mockReturnValue({ ...detailState, loading: true, project: null });
    renderComponent();
    expect(screen.getByTestId('groupwork-skeleton')).toBeTruthy();
  });

  it('shows the missing project state when the project is unavailable', () => {
    useProjectDetail.mockReturnValue({ ...detailState, project: null, loading: false });
    renderComponent();
    expect(screen.getByText('This group project isn’t available right now.')).toBeTruthy();
    expect(screen.getByText('It may have been removed, or you may no longer have access to it.')).toBeTruthy();
    expect(screen.getByText('Back to My Group Projects')).toBeTruthy();
  });
});
