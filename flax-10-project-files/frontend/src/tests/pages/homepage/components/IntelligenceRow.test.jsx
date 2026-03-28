import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntelligenceRow, { SemesterProgressWidget } from '../../../../pages/homepage/components/IntelligenceRow';
import { useAuth } from '../../../../context/AuthContext';
import { useIntelligenceDashboard, getSemesterProgress } from '../../../../pages/homepage/hooks/useIntelligenceDashboard';

// Mocks
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../pages/homepage/hooks/useIntelligenceDashboard', () => ({
  useIntelligenceDashboard: vi.fn(),
  CATALOGUE: [],
  DEFAULT_LAYOUT: ['test-layout'],
  getSemesterProgress: vi.fn(),
}));

vi.mock('../../../../components/common', () => ({
  ConfirmModal: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      {title}
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../../../pages/homepage/components/IntelligenceGrid', () => ({
  default: (props) => (
    <div data-testid="IntelligenceGrid">
      {props.widgetRenderer('test-widget', 'small')}
      <button onClick={() => props.setEdit(true)}>Set Edit</button>
    </div>
  )
}));

vi.mock('../../../../pages/homepage/components/IntelligenceWidgetRenderer', () => ({
  renderIntelligenceWidget: (id) => <div data-testid={`widget-${id}`}>{id}</div>
}));

const defaultProps = {
  calendarEvents: [],
  displayName: 'Test User',
  state: { homepageRecommendation: null },
  upcomingDeadlines: [],
};

describe('IntelligenceRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders IntelligenceGrid and handles dashboard state', () => {
    useAuth.mockReturnValue({ profile: { id: 1 } });
    const mockDashboard = {
      edit: false, layout: [], handleRandomize: vi.fn(), handleReset: vi.fn(),
      setEdit: vi.fn(), setLayout: vi.fn(), setShowAdd: vi.fn(),
      setWidgetSize: vi.fn(), showAdd: false, widgetSizes: {}, showResetConfirm: false,
    };
    useIntelligenceDashboard.mockReturnValue(mockDashboard);
    render(<IntelligenceRow {...defaultProps} />);
    expect(screen.getByTestId('IntelligenceGrid')).toBeTruthy();
    fireEvent.click(screen.getByText('Set Edit'));
    expect(mockDashboard.setEdit).toHaveBeenCalledWith(true);
  });

  it('renders and handles ResetModal', () => {
    useAuth.mockReturnValue({ profile: { id: 1 } });
    const mockDashboard = {
      showResetConfirm: true, setShowResetConfirm: vi.fn(), setLayout: vi.fn(),
    };
    useIntelligenceDashboard.mockReturnValue(mockDashboard);
    render(<IntelligenceRow {...defaultProps} />);
    expect(screen.getByTestId('confirm-modal')).toBeTruthy();
    fireEvent.click(screen.getByText('Confirm'));
    expect(mockDashboard.setLayout).toHaveBeenCalledWith(['test-layout']);
    expect(mockDashboard.setShowResetConfirm).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockDashboard.setShowResetConfirm).toHaveBeenCalledWith(false);
  });
});

describe('SemesterProgressWidget', () => {
  it('renders progress correctly when started', () => {
    vi.mocked(getSemesterProgress).mockReturnValue({ pct: 50, hasStarted: true, isFinished: false });
    render(<SemesterProgressWidget />);
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('50% through term')).toBeTruthy();
  });

  it('renders completed message when finished', () => {
    vi.mocked(getSemesterProgress).mockReturnValue({ pct: 100, isFinished: true });
    render(<SemesterProgressWidget />);
    expect(screen.getByText('Semester completed')).toBeTruthy();
  });

  it('renders not started message when not started', () => {
    vi.mocked(getSemesterProgress).mockReturnValue({ pct: 0, hasStarted: false });
    render(<SemesterProgressWidget />);
    expect(screen.getByText('Semester not started')).toBeTruthy();
  });

  it('renders null when no progress', () => {
    vi.mocked(getSemesterProgress).mockReturnValue(null);
    const { container } = render(<SemesterProgressWidget />);
    expect(container.firstChild).toBeNull();
  });
});
