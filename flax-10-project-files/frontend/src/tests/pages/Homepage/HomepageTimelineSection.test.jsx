import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const navigateMock = vi.fn();
const isTodayMock = vi.fn(() => true);
const miniTimelinePropsSpy = vi.fn();

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const {
            animate: _animate,
            initial: _initial,
            layout: _layout,
            transition: _transition,
            viewport: _viewport,
            whileInView: _whileInView,
            ...rest
          } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../components/common", () => ({
  ConfirmModal: ({ title, message, confirmText, cancelText, infoHint, onConfirm, onCancel }) => (
    <div data-testid="reschedule-modal">
      <div>{title}</div>
      <div>{message}</div>
      <div>{infoHint}</div>
      <button type="button" onClick={onConfirm}>
        {confirmText}
      </button>
      <button type="button" onClick={onCancel}>
        {cancelText}
      </button>
    </div>
  ),
}));

vi.mock("../../../components/Common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick, pill: _pill, ...props }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline", () => ({
  MiniTimeline: (props) => {
    miniTimelinePropsSpy(props);
    return (
      <div data-testid="mini-timeline">
        <button type="button" onClick={() => props.onToggleComplete("event-1")}>
          toggle-complete
        </button>
        <button type="button" onClick={() => props.onEdit({ id: 7, tag: "routine" })}>
          edit-item
        </button>
        <div>{`${props.timerMode}:${props.timeLeft}:${props.hasTimerSession}`}</div>
      </div>
    );
  },
}));

import { HomepageTimelineSection } from "../../../pages/Homepage/components/HomepageTimelineSection";

function createProps(overrides = {}) {
  return {
    completedEventIds: new Set(),
    dayTasks: [{ id: 1, title: "Essay" }],
    deadlineSuggestions: [{ id: 2 }],
    getTag: vi.fn(() => ({ label: "Routine" })),
    handleConflictAutoMove: vi.fn(),
    handleConflictPushTomorrow: vi.fn(),
    handleQuickStartGap: vi.fn(),
    handleResolveTimelineConflicts: vi.fn().mockResolvedValue(undefined),
    handleReschedule: vi.fn(),
    handleTaskToggle: vi.fn(),
    handleTimelineDelete: vi.fn(),
    hasTimerSession: true,
    now: new Date("2026-03-24T12:00:00.000Z"),
    openModal: vi.fn(),
    openTimelinePopup: vi.fn(),
    resolveConflictsLoading: false,
    selectedDate: new Date("2026-03-24T12:00:00.000Z"),
    setCompletedEventIds: vi.fn(),
    sortedEvents: [{ id: 99, title: "Lecture" }],
    styles: {
      bentoSpine: "bento-spine",
      timelineBox: "timeline-box",
      timelineHeaderButton: "timeline-header-button",
      timelineHeaderRight: "timeline-header-right",
      timelineTrack: "timeline-track",
      timelineTrackContent: "timeline-track-content",
    },
    suggestableTasks: [{ id: 4, title: "Read" }],
    taskLists: [{ id: 1, name: "Inbox" }],
    tasksDueToday: [{ id: 5 }],
    timeLeft: 1800,
    timerMode: "work",
    timerTask: "Essay",
    ...overrides,
  };
}

describe("HomepageTimelineSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(true);
  });

  it("renders the full section, toggles timeline completion, and confirms rescheduling", async () => {
    const props = createProps();
    render(<HomepageTimelineSection {...props} />);

    fireEvent.click(screen.getByText("View my calendar"));
    expect(navigateMock).toHaveBeenCalledWith("/calendar");

    fireEvent.click(screen.getByText("toggle-complete"));
    const updater = props.setCompletedEventIds.mock.calls[0][0];
    expect(Array.from(updater(new Set()))).toEqual(["event-1"]);
    expect(Array.from(updater(new Set(["event-1"])))).toEqual([]);

    fireEvent.click(screen.getByText("edit-item"));
    expect(props.openModal).toHaveBeenCalledWith({ id: 7, tag: "routine" }, "routine");

    fireEvent.click(screen.getByText("Reschedule my events"));
    expect(screen.getByTestId("reschedule-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(props.handleResolveTimelineConflicts).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("reschedule-modal")).not.toBeInTheDocument());

    expect(miniTimelinePropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hasTimerSession: true,
        timeLeft: 1800,
        timerMode: "work",
        timerTask: "Essay",
      }),
    );
  });

  it("renders the widget version without the outer section wrapper and hides the reschedule action when not applicable", () => {
    isTodayMock.mockReturnValue(false);

    const { container } = render(
      <HomepageTimelineSection
        {...createProps({
          handleResolveTimelineConflicts: null,
          isWidget: true,
          resolveConflictsLoading: true,
        })}
      />,
    );

    expect(container.querySelector("#timeline-section")).toBeNull();
    expect(container.querySelector(".timeline-box")).toBeNull();
    expect(screen.queryByText("Rescheduling…")).not.toBeInTheDocument();
    expect(screen.queryByText("Reschedule my events")).not.toBeInTheDocument();
  });
});
