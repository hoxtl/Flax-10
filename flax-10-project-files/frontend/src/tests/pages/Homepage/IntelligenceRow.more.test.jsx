import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const dashboardState = vi.hoisted(() => ({
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
  getSemesterProgress: vi.fn(),
  renderIntelligenceWidget: vi.fn(() => <div data-testid="rendered-widget">widget</div>),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 10 }, profile: { role: "student" } }),
}));

vi.mock("../../../components/common", () => ({
  ConfirmModal: ({ title, message, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onConfirm}>confirm reset</button>
      <button onClick={onCancel}>cancel reset</button>
    </div>
  ),
}));

vi.mock("../../../pages/Homepage/components/IntelligenceGrid", () => ({
  default: (props) => (
    <div data-testid="intelligence-grid">
      <div data-testid="grid-props">{JSON.stringify({ catalogue: props.catalogue, edit: props.edit, layout: props.layout, showAdd: props.showAdd })}</div>
      <button onClick={() => props.widgetRenderer("hero", { row: 4 })}>render hero</button>
    </div>
  ),
}));

vi.mock("../../../pages/Homepage/components/IntelligenceWidgetRenderer", () => ({
  renderIntelligenceWidget: (...args) => dashboardState.renderIntelligenceWidget(...args),
}));

vi.mock("../../../pages/Homepage/hooks/useIntelligenceDashboard", () => ({
  CATALOGUE: ["hero", "rightNow", "todayTasks"],
  DEFAULT_LAYOUT: ["hero", "deadlines", "todayTasks", "bigTimeline"],
  getSemesterProgress: (...args) => dashboardState.getSemesterProgress(...args),
  useIntelligenceDashboard: () => dashboardState.dashboard,
}));

import IntelligenceRow, { SemesterProgressWidget } from "../../../pages/Homepage/components/IntelligenceRow";

describe("IntelligenceRow extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardState.dashboard = {
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

  it("passes dashboard grid props through and delegates widget rendering", () => {
    render(<IntelligenceRow displayName="Mia" slot1TodayTasks={<div />} />);
    expect(screen.getByTestId("grid-props").textContent).toContain('"catalogue":["hero","rightNow","todayTasks"]');
    expect(screen.getByTestId("grid-props").textContent).toContain('"layout":["hero","rightNow"]');

    fireEvent.click(screen.getByText("render hero"));
    expect(dashboardState.renderIntelligenceWidget).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({
        displayName: "Mia",
        slot1TodayTasks: expect.any(Object),
        dashboard: dashboardState.dashboard,
      }),
      { row: 4 },
    );
  });

  it("opens reset modal actions when confirmation is showing", () => {
    dashboardState.dashboard.showResetConfirm = true;
    render(<IntelligenceRow />);

    fireEvent.click(screen.getByText("confirm reset"));
    expect(dashboardState.dashboard.setLayout).toHaveBeenCalledWith(["hero", "deadlines", "todayTasks", "bigTimeline"]);
    expect(dashboardState.dashboard.setShowResetConfirm).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("cancel reset"));
    expect(dashboardState.dashboard.setShowResetConfirm).toHaveBeenCalledWith(false);
  });

  it("renders semester progress states and hides when unavailable", () => {
    dashboardState.getSemesterProgress.mockReturnValueOnce(null);
    const { rerender, container } = render(<SemesterProgressWidget />);
    expect(container).toBeEmptyDOMElement();

    dashboardState.getSemesterProgress.mockReturnValueOnce({ pct: 41, hasStarted: true, isFinished: false });
    rerender(<SemesterProgressWidget />);
    expect(screen.getByText("41%")).toBeTruthy();
    expect(screen.getByText("41% through term")).toBeTruthy();

    dashboardState.getSemesterProgress.mockReturnValueOnce({ pct: 0, hasStarted: false, isFinished: false });
    rerender(<SemesterProgressWidget />);
    expect(screen.getByText("Semester not started")).toBeTruthy();

    dashboardState.getSemesterProgress.mockReturnValueOnce({ pct: 100, hasStarted: true, isFinished: true });
    rerender(<SemesterProgressWidget />);
    expect(screen.getByText("Semester completed")).toBeTruthy();
  });
});
