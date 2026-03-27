/**
 * Covers HomepageTimelineSection interactions and widget mode branches.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createFnMap } from "../../utils/testBuilderUtils";

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

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
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

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, pill: _pill, ...props }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../pages/homepage/components/mini_timeline", () => ({
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

import { HomepageTimelineSection } from "../../../pages/homepage/components/HomepageTimelineSection";

const baseTimelineProps = {
  completedEventIds: new Set(),
  dayTasks: [{ id: 1, title: "Essay" }],
  deadlineSuggestions: [{ id: 2 }],
  hasTimerSession: true,
  now: new Date("2026-03-24T12:00:00.000Z"),
  resolveConflictsLoading: false,
  selectedDate: new Date("2026-03-24T12:00:00.000Z"),
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
};

const propFnNames = [
  "handleConflictAutoMove",
  "handleConflictPushTomorrow",
  "handleQuickStartGap",
  "handleReschedule",
  "handleTaskToggle",
  "handleTimelineDelete",
  "openModal",
  "openTimelinePopup",
  "setCompletedEventIds",
];

function createProps(overrides = {}) {
  return {
    ...baseTimelineProps,
    getTag: vi.fn(() => ({ label: "Routine" })),
    ...createFnMap(propFnNames),
    handleResolveTimelineConflicts: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("HomepageTimelineSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(true);
  });

  it("renders the section and handles calendar navigation", () => {
    render(<HomepageTimelineSection {...createProps()} />);
    fireEvent.click(screen.getByText("View my calendar"));
    expect(navigateMock).toHaveBeenCalledWith("/calendar");
  });

  it("handles timeline completion toggles", () => {
    const setCompletedEventIds = vi.fn();
    render(<HomepageTimelineSection {...createProps({ setCompletedEventIds })} />);
    fireEvent.click(screen.getByText("toggle-complete"));
    const updater = setCompletedEventIds.mock.calls[0][0];
    expect(Array.from(updater(new Set()))).toEqual(["event-1"]);
  });

  it("handles event editing and rescheduling modals", async () => {
    const props = createProps();
    render(<HomepageTimelineSection {...props} />);
    fireEvent.click(screen.getByText("edit-item"));
    expect(props.openModal).toHaveBeenCalledWith({ id: 7, tag: "routine" }, "routine");
    
    fireEvent.click(screen.getByText("Reschedule my events"));
    fireEvent.click(screen.getByText("Reschedule now"));
    await waitFor(() => expect(props.handleResolveTimelineConflicts).toHaveBeenCalled());
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
