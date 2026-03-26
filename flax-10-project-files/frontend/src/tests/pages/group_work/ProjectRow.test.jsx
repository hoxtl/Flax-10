import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProjectRow from '../../../pages/group_work/components/ProjectRow';

function buildProject(overrides = {}) {
  return {
    id: 1,
    name: 'Systems Design Sprint',
    deadline: '2026-03-28T23:59:00Z',
    course_code: '5CCS2SEG',
    module_name: 'Software Engineering',
    task_count: 5,
    completed_task_count: 2,
    member_count: 5,
    members: [
      { id: 11, user: 11, user_name: 'janedoe', first_name: 'Jane', last_name: 'Doe' },
      { id: 12, user: 12, user_name: 'mia.gray', first_name: 'Mia', last_name: 'Gray' },
      { id: 13, user: 13, user_name: 'leo.park', first_name: 'Leo', last_name: 'Park' },
      { id: 14, user: 14, user_name: 'ava.reed', first_name: 'Ava', last_name: 'Reed' },
      { id: 15, user: 15, user_name: 'noah.lee', first_name: 'Noah', last_name: 'Lee' },
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

  it('shows the shared countdown format, real module pill, and every team member avatar', () => {
    const { container } = render(
      <MemoryRouter>
        <ProjectRow project={buildProject()} onClick={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('7d')).toBeTruthy();
    expect(screen.queryByText('7 days')).toBeNull();
    expect(screen.getByText('5CCS2SEG')).toBeTruthy();
    expect(screen.getByText('Software Engineering')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Systems Design Sprint project details' })).toBeTruthy();
    expect(screen.getByLabelText('40% completion')).toBeTruthy();
    expect(screen.queryByText(/tasks done/i)).toBeNull();
    expect(screen.queryByText('JD')).toBeNull();
    expect(screen.getByText('5 members')).toBeTruthy();
    expect(screen.queryByText('+1')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Jane Doe profile' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Mia Gray profile' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Leo Park profile' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Ava Reed profile' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Noah Lee profile' })).toBeTruthy();
    expect(container.firstChild.className).toContain('projectRowContainerUrgent');
  });

  it('handles keyboard activation and overdue styling for past projects', () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <ProjectRow
          project={buildProject({ deadline: '2000-01-01T00:00:00Z', members: [{ id: 11, user: 11, user_name: 'janedoe' }] })}
          onClick={onClick}
        />
      </MemoryRouter>
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /Open Systems Design Sprint project details/ }), { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
    expect(document.querySelector('article').className).toContain('projectRowContainerOverdue');
  });
});
