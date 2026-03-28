<<<<<<< HEAD
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
=======
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  dashboard: {
    edit: false,
    layout: ["hero", "rightNow"],
    handleRandomize: vi.fn(),
    handleReset: vi.fn(),
    setEdit: vi.fn(),
    setLayout: vi.fn(),
    setShowAdd: vi.fn(),
    setWidgetSize: vi.fn(),
    showAdd: true,
    widgetSizes: { hero: { row: 2 } },
    showResetConfirm: false,
    setShowResetConfirm: vi.fn(),
  },
  renderIntelligenceWidget: vi.fn(() => <div data-testid="rendered-widget">widget</div>),
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({
    profile: { id: 7, role: "student" },
    user: { id: 7, role: "student" },
  }),
}));

vi.mock("../../../../components/common", () => ({
  ConfirmModal: ({ title, message, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" onClick={onConfirm}>confirm reset</button>
      <button type="button" onClick={onCancel}>cancel reset</button>
>>>>>>> main
    </div>
  ),
}));

<<<<<<< HEAD
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
=======
vi.mock("../../../../pages/homepage/components/IntelligenceGrid", () => ({
  default: (props) => (
    <div data-testid="intelligence-grid">
      <div data-testid="grid-props">{JSON.stringify({
        catalogue: props.catalogue,
        edit: props.edit,
        layout: props.layout,
        showAdd: props.showAdd,
      })}</div>
      <button type="button" onClick={() => props.widgetRenderer("hero", { row: 4 })}>render hero</button>
      <button type="button" onClick={() => props.widgetRenderer("todayTasks", { row: 1 })}>render today tasks</button>
      <button type="button" onClick={() => props.widgetRenderer("deadlines", { row: 1 })}>render deadlines</button>
    </div>
  ),
}));

vi.mock("../../../../pages/homepage/components/IntelligenceWidgetRenderer", () => ({
  renderIntelligenceWidget: (...args) => state.renderIntelligenceWidget(...args),
}));

vi.mock("../../../../pages/homepage/hooks/useIntelligenceDashboard", () => ({
  CATALOGUE: ["hero", "rightNow", "todayTasks"],
  DEFAULT_LAYOUT: ["hero", "deadlines", "todayTasks", "bigTimeline"],
  getSemesterProgress: vi.fn(),
  useIntelligenceDashboard: () => state.dashboard,
}));

import IntelligenceRow from "../../../../pages/homepage/components/IntelligenceRow";

describe("IntelligenceRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.dashboard = {
      edit: false,
      layout: ["hero", "rightNow"],
      handleRandomize: vi.fn(),
      handleReset: vi.fn(),
      setEdit: vi.fn(),
      setLayout: vi.fn(),
      setShowAdd: vi.fn(),
      setWidgetSize: vi.fn(),
      showAdd: true,
      widgetSizes: { hero: { row: 2 } },
      showResetConfirm: false,
      setShowResetConfirm: vi.fn(),
    };
  });

  it("renders the intelligence grid shell", () => {
    render(<IntelligenceRow />);
    expect(screen.getByTestId("intelligence-grid")).toBeInTheDocument();
  });

  it("passes dashboard grid props through", () => {
    render(<IntelligenceRow />);
    expect(screen.getByTestId("grid-props").textContent).toContain('"catalogue":["hero","rightNow","todayTasks"]');
    expect(screen.getByTestId("grid-props").textContent).toContain('"layout":["hero","rightNow"]');
    expect(screen.getByTestId("grid-props").textContent).toContain('"showAdd":true');
  });

  it("delegates slot1TodayTasks through widget rendering", () => {
    render(<IntelligenceRow slot1TodayTasks={<div data-testid="today-tasks">Tasks</div>} />);
    fireEvent.click(screen.getByText("render today tasks"));
    expect(state.renderIntelligenceWidget).toHaveBeenCalledWith(
      "todayTasks",
      expect.objectContaining({ slot1TodayTasks: expect.any(Object) }),
      { row: 1 },
    );
  });

  it("delegates slot3Urgent through widget rendering", () => {
    render(<IntelligenceRow slot3Urgent={<div data-testid="urgent">Urgent</div>} />);
    fireEvent.click(screen.getByText("render deadlines"));
    expect(state.renderIntelligenceWidget).toHaveBeenCalledWith(
      "deadlines",
      expect.objectContaining({ slot3Urgent: expect.any(Object) }),
      { row: 1 },
    );
  });

  it("passes displayName into widget rendering when provided", () => {
    render(<IntelligenceRow displayName="Alice" />);
    fireEvent.click(screen.getByText("render hero"));
    expect(state.renderIntelligenceWidget).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({ displayName: "Alice" }),
      { row: 4 },
    );
  });

  it("passes undefined displayName through without crashing", () => {
    render(<IntelligenceRow displayName={undefined} />);
    fireEvent.click(screen.getByText("render hero"));
    expect(state.renderIntelligenceWidget).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({ displayName: undefined }),
      { row: 4 },
    );
  });

  it("passes the auth profile into widget rendering", () => {
    render(<IntelligenceRow />);
    fireEvent.click(screen.getByText("render hero"));
    expect(state.renderIntelligenceWidget).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({ profile: expect.objectContaining({ role: "student" }) }),
      { row: 4 },
    );
  });

  it("does not render the reset modal when confirmation is hidden", () => {
    render(<IntelligenceRow />);
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });

  it("confirms reset by restoring the default layout", () => {
    state.dashboard.showResetConfirm = true;
    render(<IntelligenceRow />);
    fireEvent.click(screen.getByText("confirm reset"));
    expect(state.dashboard.setLayout).toHaveBeenCalledWith(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(state.dashboard.setShowResetConfirm).toHaveBeenCalledWith(false);
  });

  it("cancels reset by hiding the confirmation modal", () => {
    state.dashboard.showResetConfirm = true;
    render(<IntelligenceRow />);
    fireEvent.click(screen.getByText("cancel reset"));
    expect(state.dashboard.setShowResetConfirm).toHaveBeenCalledWith(false);
>>>>>>> main
  });
});
