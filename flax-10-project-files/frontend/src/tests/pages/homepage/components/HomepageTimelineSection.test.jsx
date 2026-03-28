/*
 * Tests for the homepage timeline section widget behaviour.
 */

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
    </div>
  ),
}));

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

const defaultSectionProps = {
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
  openModal: vi.fn(),
  openTimelinePopup: vi.fn(),
  resolveConflictsLoading: false,
  sortedEvents: [],
  styles: baseStyles,
  suggestableTasks: [],
  taskLists: [],
  tasksDueToday: [],
  timeLeft: 0,
  timerMode: "work",
  timerTask: null,
};

function renderSection(overrides = {}) {
  const props = {
    ...defaultSectionProps,
    completedEventIds: new Set(),
    now: new Date("2026-03-28T10:00:00.000Z"),
    selectedDate: new Date("2026-03-28T12:00:00.000Z"),
    setCompletedEventIds: vi.fn((fn) => (typeof fn === "function" ? fn(new Set()) : fn)),
    ...overrides,
  };
  return render(
    <MemoryRouter>
      <HomepageTimelineSection {...props} />
    </MemoryRouter>,
  );
}

describe("HomepageTimelineSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    miniTimelinePropsRef.current = null;
    isTodayMock.mockReturnValue(true);
  });

  it("wraps TimelineContent with animation when not a widget", () => {
    renderSection({});
    expect(screen.getByTestId("timeline-motion")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-motion")).toHaveAttribute("id", "timeline-section");
  });

  it("omits animation wrapper when rendered as a widget", () => {
    renderSection({ isWidget: true, getTag: () => ({}) });
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

  it("shows scheduling spinner copy while auto schedule is loading", () => {
    renderSection({ autoScheduleLoading: true, handleAutoSchedule: vi.fn() });
    expect(screen.getByRole("button", { name: /auto schedule study time/i })).toHaveTextContent("Scheduling…");
  });

  it("shows rescheduling spinner copy while conflict resolution is loading", () => {
    renderSection({ getTag: () => ({}), handleResolveTimelineConflicts: vi.fn(), resolveConflictsLoading: true });
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
  });
});
