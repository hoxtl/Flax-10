import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomepageDashboard } from '../../../../pages/homepage/components/HomepageDashboard';
import { useAuth } from '../../../../context/AuthContext';

// Mocks
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
  isToday: vi.fn(() => true),
}));

vi.mock('../../../../api/taskApi', () => ({
  createTask: vi.fn(),
  fetchTaskLists: vi.fn(),
  createTaskList: vi.fn(),
  deleteTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('../../../../components/calendar/EventPopups', () => ({ EventPopups: () => <div data-testid="EventPopups">EventPopups</div> }));
vi.mock('../../../../components/common/back_to_top/BackToTop', () => ({ default: () => <div data-testid="BackToTop">BackToTop</div> }));
vi.mock('../../../../pages/homepage/components/TaskWidgetSlot', () => ({ TaskWidgetSlot: () => <div data-testid="TaskWidgetSlot">TaskWidgetSlot</div> }));
vi.mock('../../../../pages/homepage/components/DeadlinesWidget', () => ({ 
  DeadlinesWidget: ({ isTeacher }) => <div data-testid="DeadlinesWidget">{isTeacher ? 'teacher' : 'student'}</div> 
}));
vi.mock('../../../../pages/homepage/components/IntelligenceRow', () => ({ 
  default: ({ slot1TodayTasks, slot3Urgent, slot6Timeline, slot5Data }) => (
    <div data-testid="IntelligenceRow">
      {slot1TodayTasks}
      {slot3Urgent}
      {slot6Timeline}
      {slot5Data && <div data-testid="slot5Data">slot5Data</div>}
    </div>
  )
}));
vi.mock('../../../../pages/homepage/components/SleepBanner', () => ({ default: () => <div data-testid="SleepBanner">SleepBanner</div> }));
vi.mock('../../../../pages/homepage/components/HomepageModals', () => ({ HomepageModals: () => <div data-testid="HomepageModals">HomepageModals</div> }));
vi.mock('../../../../pages/homepage/components/HomepageOverlays', () => ({ HomepageOverlays: () => <div data-testid="HomepageOverlays">HomepageOverlays</div> }));
vi.mock('../../../../pages/homepage/components/HomepageSkeleton', () => ({ HomepageSkeleton: () => <div data-testid="HomepageSkeleton">HomepageSkeleton</div> }));
vi.mock('../../../../pages/homepage/components', () => ({
  HomepageTimelineSection: () => <div data-testid="HomepageTimelineSection">HomepageTimelineSection</div>,
}));

const defaultProps = {
  homeDataLoading: false,
  state: {
    homepageRecommendation: 'test-rec',
    navigatorContext: {},
    sortedEvents: [],
    tomorrowFirstEvent: null,
    taskWidgetItemsOnly: false,
    enrolledModules: [],
    deadlineSuggestions: [],
    suggestableTasks: [],
    tasksDueToday: [],
    taskWidgetDueTodayCount: 0,
    taskWidgetList: [],
  },
  modals: {
    setSelectedDeadline: vi.fn(),
    setSelectedModulePill: vi.fn(),
    selectedDeadline: null,
    selectedModulePill: null,
    lastCreatedListId: null,
    planTimelineReadItem: null,
    rescheduleTask: null,
    setLastCreatedListId: vi.fn(),
    setPlanTimelineReadItem: vi.fn(),
    setRescheduleTask: vi.fn(),
    setShowCreateListFromTask: vi.fn(),
    setShowCreateTaskModal: vi.fn(),
    showCreateListFromTask: false,
    showCreateTaskModal: false,
  },
  reschedule: {
    handleAutoSchedule: vi.fn(),
    autoScheduleLoading: false,
    handleConflictAutoMove: vi.fn(),
    handleConflictPushTomorrow: vi.fn(),
    handleQuickStartGap: vi.fn(),
    handleResolveTimelineConflicts: vi.fn(),
    handleReschedule: vi.fn(),
    handleTimelineDelete: vi.fn(),
    resolveConflictsLoading: false,
  },
  toast: { showToast: vi.fn() },
  taskLists: [],
  now: new Date(),
  selectedDate: new Date(),
  handleTaskToggle: vi.fn(),
  openModal: vi.fn(),
  openTimelinePopup: vi.fn(),
  handleTaskWidgetComplete: vi.fn(),
  deleteTaskAndRefresh: vi.fn(),
  handleInlineTaskEdit: vi.fn(),
  taskWidgetRef: { current: null },
};

describe('HomepageDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton when loading', () => {
    render(<HomepageDashboard homeDataLoading={true} />);
    expect(screen.getByTestId('HomepageSkeleton')).toBeTruthy();
  });

  it('renders content when not loading', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('IntelligenceRow')).toBeTruthy();
    expect(screen.getByTestId('SleepBanner')).toBeTruthy();
    expect(screen.getByTestId('HomepageOverlays')).toBeTruthy();
    expect(screen.getByTestId('BackToTop')).toBeTruthy();
    expect(screen.getByTestId('HomepageModals')).toBeTruthy();
    expect(screen.getByTestId('EventPopups')).toBeTruthy();
  });

  it('renders sub-components inIntelligenceRow', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('TaskWidgetSlot')).toBeTruthy();
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
    expect(screen.getByTestId('HomepageTimelineSection')).toBeTruthy();
  });

  it('handles role-based logic in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: { role: 'teacher' } });
    const { rerender } = render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
    
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    rerender(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
  });

  it('handles role-based logic fallback in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: null });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
  });

  it('handles missing upcomingDeadlines prop in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    const propsWithoutDeadlines = { ...defaultProps, upcomingDeadlines: undefined };
    render(<HomepageDashboard {...propsWithoutDeadlines} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
  });
});
