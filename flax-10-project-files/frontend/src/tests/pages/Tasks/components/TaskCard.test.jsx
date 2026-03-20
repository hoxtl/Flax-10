import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TaskCard from "../../../../pages/Tasks/components/TaskCard";

const navigateMock = vi.hoisted(() => vi.fn());
const timerMock = vi.hoisted(() => ({ setActiveTaskId: vi.fn() }));
const completionMock = vi.hoisted(() => ({ showCompletionToast: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (node) => node };
});

vi.mock("../../../../context/TimerContext", () => ({ useTimerContext: () => timerMock }));
vi.mock("../../../../context/TaskCompletionContext", () => ({ useTaskCompletion: () => completionMock }));
vi.mock("../../../../lib/completionMessages", () => ({
  getCompletionMessage: () => "Done",
  isRoutineTask: () => false,
}));
vi.mock("../../../../api/userService", () => ({ getUserSettings: vi.fn().mockResolvedValue({ sleep_time: "23:00", wake_time: "07:00" }) }));
vi.mock("../../../../api/readingApi", () => ({ getReadingSpeed: vi.fn().mockResolvedValue({ avg_min_per_page: 1.6, is_personalised: true }) }));
vi.mock("../../../../components/Settings/hooks/useSleepWarning", () => ({
  useSleepWarning: () => ({ sleepWarning: false, sleepWarningProps: {}, checkSleepAndRun: (_d, cb) => cb() }),
}));
vi.mock("../../../../components/common/SleepWarningModal", () => ({ SleepWarningModal: () => <div data-testid="sleep-warning" /> }));
vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ onChange }) => <button data-testid="due-picker" onClick={() => onChange("2026-03-10T10:00")}>picker</button>,
}));
vi.mock("../../../../components/TaskCelebration/CheckBurst", () => ({ CheckBurst: ({ children }) => <>{children}</> }));
vi.mock("../../../../pages/Tasks/components/CreateTaskModal", () => ({ default: () => <div data-testid="edit-modal" /> }));
vi.mock("../../../../pages/Tasks/components/TaskInfoModal", () => ({ TaskInfoModal: () => <div data-testid="info-modal" /> }));
vi.mock("../../../../pages/Tasks/utils/taskCardUtils", () => ({
  formatDueDate: () => ({ label: "Today", status: "today" }),
  getCompletedDueLabel: () => "Completed",
  getModuleColor: () => ({ text: "#111", border: "#222" }),
  formatFocusBlocks: () => "1 block",
  splitEstimatedBlocks: () => ({ sessionCount: 1, workMinutes: 50 }),
  PRIORITY_LABELS: { urgent: "Urgent" },
  PRIORITY_MARKS: { urgent: "!!!" },
}));

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function props(overrides = {}) {
  return {
    task: { id: 1, title: "Read book", completed: false, task_list: 1, module_code: "KCL1", module_id: 11, due_date: "2026-03-09T09:00", priority: "urgent", estimated_blocks: 2 },
    listName: "Inbox",
    listColor: "#ccc",
    lists: [{ id: 1, name: "Inbox", color: "#ccc" }, { id: 2, name: "Work", color: "#eee" }],
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    hideDueBadge: false,
    hideListBadge: false,
    isOverdue: false,
    searchQuery: "",
    ...overrides,
  };
}

describe("TaskCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens info modal on content click", () => {
    wrap(<TaskCard {...props()} />);
    fireEvent.click(screen.getByText("Read book"));
    expect(screen.getByTestId("info-modal")).toBeInTheDocument();
  });

  it("completes task and shows toast", () => {
    const p = props();
    wrap(<TaskCard {...p} />);
    fireEvent.click(screen.getByLabelText(/Mark complete/i));
    expect(p.onToggle).toHaveBeenCalled();
    expect(completionMock.showCompletionToast).toHaveBeenCalled();
  });

  it("opens context menu and deletes", () => {
    const p = props();
    wrap(<TaskCard {...p} />);
    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(p.onDelete).toHaveBeenCalled();
  });

  it("moves task to another list from context menu", () => {
    const p = props();
    wrap(<TaskCard {...p} />);
    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));
    fireEvent.click(screen.getByRole("button", { name: /Move to list/i }));
    fireEvent.click(screen.getByRole("button", { name: /Work/i }));
    expect(p.onEdit).toHaveBeenCalled();
  });

  it("sets due date from context menu picker", () => {
    const p = props();
    wrap(<TaskCard {...p} />);
    fireEvent.contextMenu(screen.getByTitle(/Right-click for more options/i));
    fireEvent.click(screen.getByRole("button", { name: /Set due date/i }));
    fireEvent.click(screen.getByTestId("due-picker"));
    expect(p.onEdit).toHaveBeenCalled();
  });

  it("starts timer from play action", () => {
    wrap(<TaskCard {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: /Study now/i }));
    expect(timerMock.setActiveTaskId).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/timer", { state: { fromTaskPlay: true } });
  });
});
