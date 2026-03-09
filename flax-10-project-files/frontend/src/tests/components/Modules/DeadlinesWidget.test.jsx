/**
 * Deadlines widget behavior and modal interactions.
 */
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeadlinesWidget from '../../../components/Modules/DeadlinesWidget';

const navigateMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();

const deadlineWithModal = [{
  id: 1,
  title: 'Urgent Essay',
  module_code: 'CS1010',
  module_name: 'Computer Science',
  module_id: 77,
  deadline_type: 'exam',
  start_due_date: 'urgent-date',
  description: 'Bring notes',
}];

const deadlinesForLinks = [
  {
    id: 1,
    title: 'Essay',
    module_code: 'ABCD1',
    module_name: 'Module A',
    module: 5,
    deadline_type: 'custom_type',
    start_due_date: 'date-a',
  },
  {
    id: 2,
    title: 'Lab',
    module_code: 'XYZ9',
    module_name: 'Module B',
    module: null,
    deadline_type: 'custom_type',
    start_due_date: 'date-b',
  },
];

const triageDeadlines = [
  {
    id: 11,
    title: 'Stamped With Number',
    module_name: 'Very Long Module Name',
    module_code: '',
    deadline_type: 'unknown',
    start_due_date: 'normal-date',
  },
  {
    id: 12,
    title: 'Stamped Without Number',
    module_name: null,
    module_code: null,
    deadline_type: null,
    start_due_date: 'nonum-date',
  },
];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../api/deadlineApi', () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlinesMock(...args),
}));

vi.mock('../../../components/Modules/utils/deadlineUtils', () => ({
  DEADLINE_LABELS: { exam: 'Exam' },
  getDeadlineCountdown: () => '1 day left',
  getDeadlineUrgency: () => 'critical',
  getDeadlineDotUrgency: () => 'safe',
  formatDeadlineDateTime: () => 'Mon 10:00',
  getTimeRemainingCountdown: () => '12h left',
  getDueInPhrase: () => 'soon',
  getTimeRemainingMonospace: () => 'mono',
  getTimeRemainingClean: () => 'clean',
  getTimeRemainingStamped: (date) => (String(date).includes('nonum') ? { number: null, unit: 'Today' } : { number: 2, unit: 'h' }),
  isDeadlineUnder24h: (date) => String(date).includes('urgent'),
}));

function renderWidget(props = {}) {
  return render(
    <MemoryRouter>
      <DeadlinesWidget {...props} />
    </MemoryRouter>,
  );
}

describe('components/Modules/DeadlinesWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when there are no deadlines', async () => {
    getUpcomingDeadlinesMock.mockResolvedValue([]);
    const { container } = renderWidget();
    await waitFor(() => expect(getUpcomingDeadlinesMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders deadlines and modal flow with close button', async () => {
    getUpcomingDeadlinesMock.mockResolvedValue(deadlineWithModal);
    renderWidget();

    expect(await screen.findByText('Upcoming Deadlines')).toBeTruthy();
    fireEvent.click(screen.getByText('Urgent Essay'));
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    await waitFor(() => expect(screen.queryByText('Module')).toBeNull());
    expect(screen.getByText('Left')).toBeTruthy();
    expect(screen.getByText('Bring notes')).toBeTruthy();
  });

  it('uses onModuleTagClick when supplied', async () => {
    const onModuleTagClick = vi.fn();
    getUpcomingDeadlinesMock.mockResolvedValue(deadlinesForLinks);
    render(
      <MemoryRouter>
        <DeadlinesWidget onModuleTagClick={onModuleTagClick} />
      </MemoryRouter>,
    );

    const firstModulePill = await screen.findByText('ABCD');
    fireEvent.click(firstModulePill);
    expect(onModuleTagClick).toHaveBeenCalledWith(5, 'ABCD1');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates on module click when callback is missing', async () => {
    getUpcomingDeadlinesMock.mockResolvedValue(deadlinesForLinks);
    const { rerender } = render(
      <MemoryRouter>
        <DeadlinesWidget onModuleTagClick={vi.fn()} />
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <DeadlinesWidget />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByText('ABCD'));
    fireEvent.click(screen.getByText('XYZ9'));
    expect(screen.getByText('Module')).toBeTruthy();
    expect(navigateMock).toHaveBeenCalledWith('/modules?moduleId=5');
    expect(navigateMock).toHaveBeenCalledWith('/modules?code=XYZ9');
  });

  it('supports triage variant and hideHeader branch', async () => {
    getUpcomingDeadlinesMock.mockResolvedValue(triageDeadlines);

    renderWidget({ variant: 'triage', hideHeader: true });
    expect(await screen.findByText('Stamped With Number')).toBeTruthy();
    expect(screen.queryByText('Upcoming Deadlines')).toBeNull();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('h left')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('MOD')).toBeTruthy();
  });
});
