import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryRailSection } from '../../../../components/Timer/historyPanel/HistoryRailSection';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../../components/Timer/utils/historyFormatter', () => ({
  formatDuration: (s) => (s ? `${Math.floor(s / 60)}m` : null),
  formatTimeRange: (start, end) => (start && end ? '10:00–11:00' : null),
}));

vi.mock('../../../../components/Timer/historyPanel/historyPanelUtils', () => ({
  getModuleLabel: (block) => block.module || null,
}));

vi.mock('../../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children }) => <button>{children}</button>,
}));

const makeBlock = (overrides = {}) => ({
  id: '1',
  task: 'Deep Work',
  totalDuration: 3600,
  totalBreak: 600,
  startTime: '2024-01-01T10:00:00',
  endTime: '2024-01-01T11:00:00',
  module: 'CS101',
  sessions: [{ status: 'Complete' }, { status: 'Incomplete' }],
  ...overrides,
});

const makeGroup = (entries, label = 'Today') => ({ label, entries });

describe('HistoryRailSection', () => {
  it('renders the section label', () => {
    render(<HistoryRailSection group={makeGroup([makeBlock()])} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('renders the task name', () => {
    render(<HistoryRailSection group={makeGroup([makeBlock()])} />);
    expect(screen.getByText('Deep Work')).toBeTruthy();
  });

  it('falls back to "Focus Session" when task is absent', () => {
    render(<HistoryRailSection group={makeGroup([makeBlock({ task: undefined })])} />);
    expect(screen.getByText('Focus Session')).toBeTruthy();
  });

  it('renders the module label', () => {
    render(<HistoryRailSection group={makeGroup([makeBlock()])} />);
    expect(screen.getByText('CS101')).toBeTruthy();
  });

  it('falls back to "General" when module is absent', () => {
    render(<HistoryRailSection group={makeGroup([makeBlock({ module: undefined })])} />);
    expect(screen.getByText('General')).toBeTruthy();
  });
})