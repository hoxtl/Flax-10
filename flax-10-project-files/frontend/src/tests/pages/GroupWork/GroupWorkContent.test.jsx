import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import GroupWorkContent from '../../../pages/GroupWork/components/GroupWorkContent';

vi.mock('../../../pages/GroupWork/components/CreateProjectForm', () => ({
  default: ({ onCreated }) => (
    <button type="button" onClick={() => onCreated?.({ id: 99, name: 'Created project' })}>
      + Create project
    </button>
  ),
}));

function buildProject(id, deadline, name = `Project ${id}`) {
  return {
    id,
    name,
    deadline,
    course_code: `CODE${id}`,
    module_name: `Module ${id}`,
    task_count: 4,
    completed_task_count: 1,
    member_count: 4,
    members: [
      { id: 1, user: 1, user_name: 'janedoe', first_name: 'Jane', last_name: 'Doe' },
      { id: 2, user: 2, user_name: 'mia.gray', first_name: 'Mia', last_name: 'Gray' },
      { id: 3, user: 3, user_name: 'leo.park', first_name: 'Leo', last_name: 'Park' },
      { id: 4, user: 4, user_name: 'ava.reed', first_name: 'Ava', last_name: 'Reed' },
    ],
  };
}

describe('GroupWorkContent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T10:00:00Z'));
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'janedoe' }));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('sorts projects by due date when due date is selected', () => {
    render(
      <MemoryRouter>
        <GroupWorkContent
          projects={[
            buildProject(1, '2026-03-29T23:59:00Z', 'Later project'),
            buildProject(2, '2026-03-24T23:59:00Z', 'Sooner project'),
          ]}
          projectListProps={() => ({ onClick: vi.fn() })}
          sortBy="due-date"
          setSortBy={vi.fn()}
          onProjectCreated={vi.fn()}
        />
      </MemoryRouter>
    );

    const sooner = screen.getByText('Sooner project');
    const later = screen.getByText('Later project');
    expect(sooner.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses the shared empty state when there are no projects', () => {
    render(
      <MemoryRouter>
        <GroupWorkContent
          projects={[]}
          projectListProps={() => ({ onClick: vi.fn() })}
          sortBy="due-date"
          setSortBy={vi.fn()}
          onProjectCreated={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('No group projects yet.')).toBeTruthy();
    expect(screen.getByText(/Create a shared project linked to one of your modules/i)).toBeTruthy();
  });
});
