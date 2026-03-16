import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GroupProjectDetail from '../../../pages/GroupWork/GroupWorkDetail';

// Mock the hook directly
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => vi.fn(),
}));

// Mock hooks
vi.mock('../../../pages/GroupWork/groupWorkHooks', () => ({
  getAuthHeaders: () => ({}),
  useProject: vi.fn(),
  useProjectMembers: vi.fn(),
  useSelectedTab: vi.fn(),
}));

// Mock sub-components to avoid context issues
vi.mock('../../../pages/GroupWork/GroupTasksTab', () => ({
  default: () => <div data-testid="group-tasks-tab" />,
}));
vi.mock('../../../pages/GroupWork/AvailabilityTab', () => ({
  default: () => <div data-testid="availability-tab" />,
}));

import { useProject, useProjectMembers, useSelectedTab } from '../../../pages/GroupWork/groupWorkHooks';

const mockProject = {
  id: 1,
  name: "Detailed Project",
  course_code: "DP101",
  deadline: "2026-12-31T23:59:59Z",
};

const mockMembers = [
  { id: 101, user: 1, user_name: "Owner User", role: "owner" },
  { id: 102, user: 2, user_name: "Member User", role: "member" },
];

global.fetch = vi.fn();

function renderComponent(props = {}) {
  return render(
    <GroupProjectDetail projectId={1} onBack={vi.fn()} {...props} />
  );
}

describe('GroupWorkDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProject.mockReturnValue({ project: mockProject, loading: false });
    useProjectMembers.mockReturnValue({ members: mockMembers, setMembers: vi.fn(), loading: false });
    useSelectedTab.mockReturnValue("tasks");
  });

  it('renders project details', () => {
    renderComponent();
    expect(screen.getByDisplayValue("Detailed Project")).toBeTruthy();
    expect(screen.getByDisplayValue("DP101")).toBeTruthy();
    expect(screen.getByText(/Owner User/i)).toBeTruthy();
    expect(screen.getByText(/Member User/i)).toBeTruthy();
  });

  it('shows the skeleton shimmer while loading', () => {
    useProject.mockReturnValue({ project: null, loading: true });
    renderComponent();
    expect(screen.getByTestId('groupwork-skeleton')).toBeTruthy();
  });

  it('switches tabs', () => {
    renderComponent();
    const availabilityTab = screen.getByText("Availability");
    fireEvent.click(availabilityTab);
    expect(availabilityTab.className).toContain('tabActive');
  });

  it('adds a member', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText(/Add member by user ID/i);
    const addBtn = screen.getByText(/Add/i);
    
    fireEvent.change(input, { target: { value: "3" } });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 103, user: 3, user_name: "New Member", role: "member" }),
    });
    
    fireEvent.click(addBtn);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/members/"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
