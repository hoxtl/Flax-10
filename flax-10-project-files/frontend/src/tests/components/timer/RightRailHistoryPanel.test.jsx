import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useRightRailHistoryMock = vi.fn();
const clearRightRailHistoryMock = vi.fn();

vi.mock("../../../components/timer/history_panel/useRightRailHistory", () => ({
  useRightRailHistory: () => useRightRailHistoryMock(),
  clearRightRailHistory: (...args) => clearRightRailHistoryMock(...args),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal", () => ({
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

vi.mock("../../../components/timer/history_panel/HistoryRailSection", () => ({
  HistoryRailSection: ({ group }) => <div>{group.label}:{group.items.length}</div>,
}));

vi.mock("../../../components/timer/history_panel/WeeklyChart", () => ({
  WeeklyChart: ({ weeklySeries, maxWeeklySeconds }) => (
    <div>{`Weekly chart ${weeklySeries.length}:${maxWeeklySeconds}`}</div>
  ),
}));

import RightRailHistoryPanel from "../../../components/timer/components/RightRailHistoryPanel";

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

  it("renders history content and weekly chart", () => {
    useRightRailHistoryMock.mockReturnValue({ history: [{ id: 1 }], showClearModal: false, setShowClearModal: vi.fn(), visibleBlocks: [{ id: 1 }], groupedByHorizon: [{ label: "Today", items: [{ id: "a" }] }], weeklySeries: [{ seconds: 600 }], maxWeeklySeconds: 600 });
    render(<RightRailHistoryPanel />);
    expect(screen.getByText("Weekly chart 1:600")).toBeInTheDocument();
    expect(screen.getByText("Today:1")).toBeInTheDocument();
  });

  it("opens the clear history modal", () => {
    const setShowClearModal = vi.fn();
    useRightRailHistoryMock.mockReturnValue({ history: [{ id: 1 }], showClearModal: false, setShowClearModal, visibleBlocks: [{ id: 1 }], groupedByHorizon: [], weeklySeries: [], maxWeeklySeconds: 60 });
    render(<RightRailHistoryPanel />);
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
