<<<<<<< HEAD
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomepageTimelineSection } from "@/pages/homepage/components/HomepageTimelineSection";

const navigateMock = vi.fn();
const miniTimelinePropsRef = { current: null };
const isTodayMock = vi.fn(() => true);

vi.mock("@/components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileInView: _w, initial: _i, layout: _l, viewport: _v, transition: _t, ...rest }) => {
      if (rest.id === "timeline-section") return <div data-testid="timeline-motion" {...rest}>{children}</div>;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("@/components/common", () => ({
  ConfirmModal: ({ cancelText, confirmText, infoHint, onCancel, onConfirm }) => (
    <div data-testid="confirm-modal">
      {infoHint ? <p data-testid="confirm-hint">{infoHint}</p> : null}
      <button type="button" onClick={onConfirm}>{confirmText}</button>
      <button type="button" onClick={onCancel}>{cancelText}</button>
=======
/**
 * Covers HomepageTimelineSection interactions and widget mode branches.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createFnMap } from "../../../utils/testBuilderUtils";

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

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({
    profile: { role: "student" },
  }),
}));

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../../components/common", () => ({
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
>>>>>>> main
    </div>
  ),
}));

<<<<<<< HEAD
vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, pill: _p, size: _s, className, variant: _v, type = "button", ...rest }) => (
    <button type={type} className={className} onClick={onClick} {...rest}>{children}</button>
  ),
}));

const authProfile = vi.hoisted(() => ({ role: "student" }));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ profile: authProfile }),
}));

vi.mock("@/pages/homepage/components/mini_timeline", () => ({
  MiniTimeline: (props) => {
    miniTimelinePropsRef.current = props;
    return <div data-testid="mini-timeline">mini</div>;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("lucide-react", () => ({
  Calendar: () => <span>cal-icon</span>,
}));

const baseStyles = {
  bentoSpine: "bento",
  planTimelineWrap: "wrap",
  planTimelineList: "list",
  planTimelineListHasConflict: "conflict",
  planTimelineEmpty: "empty",
  planTimelineEmptyText: "emptyText",
  timelineBox: "box",
  timelineHeader: "th",
  timelineHeaderLeft: "thl",
  timelineHeaderRight: "thr",
  timelineHeaderButton: "thb",
  timelineTrack: "track",
  timelineTrackContent: "ttc",
};

function renderSection(overrides = {}) {
  const setCompleted = vi.fn((fn) => (typeof fn === "function" ? fn(new Set()) : fn));
  const props = {
    completedEventIds: new Set(),
    dayTasks: [],
    deadlineSuggestions: [],
    getTag: () => ({ name: "lecture" }),
    handleAutoSchedule: vi.fn(),
    handleConflictAutoMove: vi.fn(),
    handleConflictPushTomorrow: vi.fn(),
    handleQuickStartGap: vi.fn(),
    handleReschedule: vi.fn(),
    handleResolveTimelineConflicts: vi.fn().mockResolvedValue(undefined),
    handleTaskToggle: vi.fn(),
    handleTimelineDelete: vi.fn(),
    hasTimerSession: false,
    isWidget: false,
    now: new Date("2026-03-28T10:00:00.000Z"),
    openModal: vi.fn(),
    openTimelinePopup: vi.fn(),
    resolveConflictsLoading: false,
    selectedDate: new Date("2026-03-28T12:00:00.000Z"),
    setCompletedEventIds: setCompleted,
    sortedEvents: [],
    styles: baseStyles,
    suggestableTasks: [],
    taskLists: [],
    tasksDueToday: [],
    timeLeft: 0,
    timerMode: "work",
    timerTask: null,
    ...overrides,
  };

  return render(
    <MemoryRouter>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <HomepageTimelineSection {...props} />
    </MemoryRouter>,
  );
=======
vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, pill: _pill, ...props }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../../pages/homepage/components/mini_timeline", () => ({
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

import { HomepageTimelineSection } from "../../../../pages/homepage/components/HomepageTimelineSection";

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
>>>>>>> main
}

describe("HomepageTimelineSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
<<<<<<< HEAD
    miniTimelinePropsRef.current = null;
    isTodayMock.mockReturnValue(true);
  });

  it("wraps TimelineContent with animation unless rendered as a widget", () => {
    const { rerender } = renderSection({});
    expect(screen.getByTestId("timeline-motion")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-motion")).toHaveAttribute("id", "timeline-section");

    rerender(
      <MemoryRouter>
        <HomepageTimelineSection
          completedEventIds={new Set()}
          dayTasks={[]}
          deadlineSuggestions={[]}
          getTag={() => ({})}
          handleQuickStartGap={vi.fn()}
          handleTaskToggle={vi.fn()}
          hasTimerSession={false}
          isWidget
          now={new Date()}
          openModal={vi.fn()}
          openTimelinePopup={vi.fn()}
          selectedDate={new Date()}
          setCompletedEventIds={vi.fn()}
          sortedEvents={[]}
          styles={baseStyles}
          suggestableTasks={[]}
          taskLists={[]}
          tasksDueToday={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("timeline-motion")).toBeNull();
  });

  it("navigates to the calendar from the header CTA", () => {
    renderSection({});
    fireEvent.click(screen.getByRole("button", { name: /view my calendar/i }));
    expect(navigateMock).toHaveBeenCalledWith("/calendar");
  });

  it("runs auto schedule when the handler is wired", () => {
    const handleAutoSchedule = vi.fn();
    renderSection({ autoScheduleLoading: false, handleAutoSchedule });
    fireEvent.click(screen.getByRole("button", { name: /auto schedule study time/i }));
    expect(handleAutoSchedule).toHaveBeenCalled();
  });

  it("omits auto schedule when no handler is provided", () => {
    renderSection({ handleAutoSchedule: undefined });
    expect(screen.queryByRole("button", { name: /auto schedule study time/i })).toBeNull();
  });

  it("shows spinner copy while auto scheduling or conflict resolution runs", () => {
    const { rerender } = renderSection({ autoScheduleLoading: true, handleAutoSchedule: vi.fn() });
    expect(screen.getByRole("button", { name: /auto schedule study time/i })).toHaveTextContent("Scheduling…");

    rerender(
      <MemoryRouter>
        <HomepageTimelineSection
          autoScheduleLoading={false}
          completedEventIds={new Set()}
          dayTasks={[]}
          deadlineSuggestions={[]}
          getTag={() => ({})}
          handleAutoSchedule={vi.fn()}
          handleQuickStartGap={vi.fn()}
          handleResolveTimelineConflicts={vi.fn()}
          handleTaskToggle={vi.fn()}
          hasTimerSession={false}
          now={new Date("2026-03-28T10:00:00.000Z")}
          openModal={vi.fn()}
          openTimelinePopup={vi.fn()}
          resolveConflictsLoading
          selectedDate={new Date("2026-03-28T12:00:00.000Z")}
          setCompletedEventIds={vi.fn()}
          sortedEvents={[]}
          styles={baseStyles}
          suggestableTasks={[]}
          taskLists={[]}
          tasksDueToday={[]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: /reschedule my events/i })).toHaveTextContent("Rescheduling…");
  });

  it("opens the reschedule confirmation modal for teachers with clarified hint copy", async () => {
    authProfile.role = "teacher";

    const handleResolveTimelineConflicts = vi.fn().mockResolvedValue(undefined);
    renderSection({ handleResolveTimelineConflicts, resolveConflictsLoading: false });

    fireEvent.click(screen.getByRole("button", { name: /reschedule my events/i }));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-hint")).toHaveTextContent("Lectures, exams,");

    fireEvent.click(screen.getByRole("button", { name: /reschedule now/i }));
    await Promise.resolve();
    expect(handleResolveTimelineConflicts).toHaveBeenCalled();
    authProfile.role = "student";
  });

  it("mentions societies in the reschedule hint for students", () => {
    authProfile.role = "student";
    renderSection({ handleResolveTimelineConflicts: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: /reschedule my events/i }));
    expect(screen.getByTestId("confirm-hint")).toHaveTextContent("societies");
  });

  it("hides the reschedule CTA when the selected day is not today", () => {
    isTodayMock.mockReturnValue(false);
    renderSection({
      handleResolveTimelineConflicts: vi.fn(),
      selectedDate: new Date("2025-01-01T12:00:00.000Z"),
    });
    expect(screen.queryByRole("button", { name: /reschedule my events/i })).toBeNull();
  });

  it("routes timeline edits through openModal with tag metadata", () => {
    const openModal = vi.fn();
    renderSection({ openModal });
    miniTimelinePropsRef.current?.onEdit?.({ id: 3, tag: 9 });
    expect(openModal).toHaveBeenCalledWith({ id: 3, tag: 9 }, 9);
  });

  it("passes toggle handlers into MiniTimeline props", () => {
    const setCompletedEventIds = vi.fn((updater) => updater(new Set()));
    renderSection({ setCompletedEventIds, sortedEvents: [{ id: "evt-1" }] });
    const toggle = miniTimelinePropsRef.current?.onToggleComplete;
    expect(typeof toggle).toBe("function");
    toggle?.(7);
    expect(setCompletedEventIds).toHaveBeenCalled();
    expect(screen.getByTestId("mini-timeline")).toBeInTheDocument();
  });

  it("removes completed ids when the same toggle fires twice", () => {
    let store = new Set([44]);
    const setCompletedEventIds = vi.fn((fn) => { store = fn(store); });
    renderSection({ setCompletedEventIds, sortedEvents: [] });
    miniTimelinePropsRef.current?.onToggleComplete?.(44);
    expect(store.has(44)).toBe(false);
  });

  it("closes the reschedule modal via the cancel action", () => {
    renderSection({ handleResolveTimelineConflicts: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: /reschedule my events/i }));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /keep plan/i }));
    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  it("hides the reschedule CTA when the resolution handler is missing", () => {
    renderSection({ handleResolveTimelineConflicts: undefined });
    expect(screen.queryByRole("button", { name: /reschedule my events/i })).toBeNull();
=======
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
>>>>>>> main
  });
});
