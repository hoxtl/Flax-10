import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProjectRow from '../../../pages/GroupWork/components/ProjectRow';

function buildProject(overrides = {}) {
  return {
    id: 1,
    name: 'Systems Design Sprint',
    deadline: '2026-03-28T23:59:00Z',
    course_code: '5CCS2SEG',
    module_name: 'Software Engineering',
    task_count: 5,
    completed_task_count: 2,
    member_count: 4,
    members: [
      { id: 11, user: 11, user_name: 'janedoe', first_name: 'Jane', last_name: 'Doe' },
      { id: 12, user: 12, user_name: 'mia.gray', first_name: 'Mia', last_name: 'Gray' },
      { id: 13, user: 13, user_name: 'leo.park', first_name: 'Leo', last_name: 'Park' },
      { id: 14, user: 14, user_name: 'ava.reed', first_name: 'Ava', last_name: 'Reed' },
    ],
    ...overrides,
  };
}

describe('ProjectRow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T10:00:00Z'));
    localStorage.setItem('user', JSON.stringify({ id: 11, username: 'janedoe' }));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('shows the shared countdown format, real module pill, and hides the signed-in user from the collaborator stack', () => {
    const { container } = render(
      <MemoryRouter>
        <ProjectRow project={buildProject()} onClick={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('7d')).toBeTruthy();
    expect(screen.queryByText('7 days')).toBeNull();
    expect(screen.getByText('5CCS2SEG')).toBeTruthy();
    expect(screen.getByText('Software Engineering')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Schedule times and view more details' })).toBeTruthy();
    expect(screen.getByLabelText('40% completion')).toBeTruthy();
    expect(screen.queryByText(/tasks done/i)).toBeNull();
    expect(screen.queryByText('JD')).toBeNull();
    expect(container.firstChild.className).toContain('projectRowContainerUrgent');
  });
});
