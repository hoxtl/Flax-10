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
    </div>
  ),
}));

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
  });
});
