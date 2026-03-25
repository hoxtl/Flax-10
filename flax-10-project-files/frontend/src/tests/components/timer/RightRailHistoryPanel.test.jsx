import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useRightRailHistoryMock = vi.fn();
const clearRightRailHistoryMock = vi.fn();

vi.mock("../../../components/Timer/historyPanel/useRightRailHistory", () => ({
  useRightRailHistory: () => useRightRailHistoryMock(),
  clearRightRailHistory: (...args) => clearRightRailHistoryMock(...args),
}));

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/common/HoldConfirmModal/HoldConfirmModal", () => ({
  default: ({ title, warningText, cancelLabel, holdLabel, onConfirm, onCancel }) => (
    <div data-testid="clear-history-modal">
      <div>{title}</div>
      <div>{warningText}</div>
      <button type="button" onClick={onConfirm}>
        {holdLabel}
      </button>
      <button type="button" onClick={onCancel}>
        {cancelLabel}
      </button>
    </div>
  ),
}));

vi.mock("../../../components/Timer/historyPanel/HistoryRailSection", () => ({
  HistoryRailSection: ({ group }) => <div>{group.label}:{group.items.length}</div>,
}));

vi.mock("../../../components/Timer/historyPanel/WeeklyChart", () => ({
  WeeklyChart: ({ weeklySeries, maxWeeklySeconds }) => (
    <div>{`Weekly chart ${weeklySeries.length}:${maxWeeklySeconds}`}</div>
  ),
}));

import RightRailHistoryPanel from "../../../components/Timer/RightRailHistoryPanel";

describe("RightRailHistoryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty state when there are no visible timer sessions", () => {
    useRightRailHistoryMock.mockReturnValue({
      history: [],
      setHistory: vi.fn(),
      showClearModal: false,
      setShowClearModal: vi.fn(),
      visibleBlocks: [],
      groupedByHorizon: [],
      weeklySeries: [],
      maxWeeklySeconds: 60,
    });

    render(<RightRailHistoryPanel />);

    expect(screen.getByText("No recent sessions.")).toBeInTheDocument();
    expect(screen.queryByText("Clear History")).not.toBeInTheDocument();
  });

  it("renders grouped history content and opens the clear modal", () => {
    const setShowClearModal = vi.fn();

    useRightRailHistoryMock.mockReturnValue({
      history: [{ id: 1 }],
      setHistory: vi.fn(),
      showClearModal: false,
      setShowClearModal,
      visibleBlocks: [{ id: 1 }],
      groupedByHorizon: [
        { label: "Today", items: [{ id: "a" }] },
        { label: "This week", items: [{ id: "b" }, { id: "c" }] },
      ],
      weeklySeries: [{ seconds: 600 }, { seconds: 300 }],
      maxWeeklySeconds: 600,
    });

    render(<RightRailHistoryPanel />);

    expect(screen.getByText("Weekly chart 2:600")).toBeInTheDocument();
    expect(screen.getByText("Today:1")).toBeInTheDocument();
    expect(screen.getByText("This week:2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear History"));

    expect(setShowClearModal).toHaveBeenCalledWith(true);
  });

  it("wires the clear-history modal confirm and cancel actions", () => {
    const setHistory = vi.fn();
    const setShowClearModal = vi.fn();

    useRightRailHistoryMock.mockReturnValue({
      history: [{ id: 1 }],
      setHistory,
      showClearModal: true,
      setShowClearModal,
      visibleBlocks: [{ id: 1 }],
      groupedByHorizon: [{ label: "Today", items: [{ id: "a" }] }],
      weeklySeries: [{ seconds: 600 }],
      maxWeeklySeconds: 600,
    });

    render(<RightRailHistoryPanel />);

    fireEvent.click(screen.getByText("Keep History"));
    expect(setShowClearModal).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("Hold to Clear"));
    expect(clearRightRailHistoryMock).toHaveBeenCalledWith(setHistory, setShowClearModal);
  });
});
