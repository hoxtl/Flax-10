/*
 * Tests for mini timeline part components: PlanFreeRowContent, TimelineRowLayout,
 * MiniTimelineRowRenderer, NowStrip, and eventAccent helpers.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
}));

vi.mock("../../../../pages/homepage/utils/dateFormatUtils", () => ({
  fmtDurationShort: (value) => `${value}m`,
  formatTime: (value) => (value ? value.slice(11, 16) : ""),
}));

vi.mock("../../../../pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => String(title || "").replace("🔥 ", ""),
}));

const doesEventOverlapSleepWindow = vi.fn(() => false);

vi.mock("../../../../components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: (...args) => doesEventOverlapSleepWindow(...args),
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/ConflictPairRow", () => ({
  ConflictPairRow: ({ row }) => <div>conflict-row:{row.id}</div>,
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/HourMarkRow", () => ({
  HourMarkRow: ({ row }) => <div>hour-row:{row.id}</div>,
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/NowRow", () => ({
  NowRow: ({ row }) => <div>now-row:{row.id}</div>,
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/PlanEventRow", () => ({
  PlanEventRow: ({ row }) => <div>event-row:{row.id}</div>,
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/PlanFreeRow", () => ({
  PlanFreeRow: ({ row, deadlineSuggestions, assignedTask, nextAssignedTask, isBestGap }) => (
    <div>
      free-row:{row.id}:{deadlineSuggestions.length}:{assignedTask ? "assigned" : "none"}:{nextAssignedTask ? "next" : "no-next"}:{String(isBestGap)}
    </div>
  ),
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/TinyGapRow", () => ({
  TinyGapRow: ({ row }) => <div>tiny-row:{row.id}</div>,
}));

import { PlanFreeRowContent } from "../../../../pages/homepage/components/mini_timeline/parts/PlanFreeRowContent";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "../../../../pages/homepage/components/mini_timeline/parts/TimelineRowLayout";
import { MiniTimelineRowRenderer, renderFreeRow as renderMiniTimelineFreeRow } from "../../../../pages/homepage/components/mini_timeline/MiniTimelineRowRenderer";
import { NowStrip } from "../../../../pages/homepage/components/mini_timeline/NowStrip";
import { getEventAccentColor } from "../../../../pages/homepage/components/mini_timeline/helpers/eventAccent";

const styles = new Proxy({}, { get: (_, key) => key });

const defaultFreeRowProps = {
  styles,
  gapContext: { type: "study" },
  durationLabel: "45m",
  assignedTask: null,
  candidateTask: null,
  isBestGap: false,
  onSkipTask: vi.fn(),
  onStartTask: vi.fn(),
};

function renderFreeRow(overrides = {}, outerClick = vi.fn()) {
  const props = { ...defaultFreeRowProps, onSkipTask: vi.fn(), onStartTask: vi.fn(), ...overrides };
  const result = render(
    <div onClick={outerClick}>
      <PlanFreeRowContent {...props} />
    </div>,
  );
  return { ...result, outerClick };
}

const defaultRendererProps = {
  styles,
  gapDeadlineFallbacks: {},
  onQuickStart: vi.fn(),
  selectedDate: "2026-03-28",
  slotPopoverRef: { current: null },
  slotPopoverRowId: null,
  setSlotPopoverRowId: vi.fn(),
  bestFreeRowId: "other-row",
  assignedGapTasks: { map: {}, nextMap: {} },
  onSkipGapTask: vi.fn(),
};

describe("PlanFreeRowContent variants", () => {
  it("renders short breather copy for study gaps", () => {
    renderFreeRow();
    expect(screen.getByText("Short breather")).toBeInTheDocument();
  });

  it("skips or starts urgent tasks in partial transit gaps", () => {
    const onSkipTask = vi.fn();
    const onStartTask = vi.fn();
    renderFreeRow({
      gapContext: { type: "transit-partial", prevCampus: "unknown", nextCampus: "other", transitMins: 15, freeAfterTransit: 20 },
      durationLabel: "20m",
      assignedTask: { id: 9, title: "Urgent task", priority: "urgent", estimated_minutes: 25 },
      onSkipTask,
      onStartTask,
    });
    fireEvent.click(screen.getByLabelText("Skip Urgent task"));
    fireEvent.click(screen.getByLabelText("Start Urgent task"));
    expect(onSkipTask).toHaveBeenCalledWith(9);
    expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Urgent task" }));
    expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
  });

  it("hides start actions when no free time remains after transit", () => {
    renderFreeRow({ gapContext: { type: "transit-partial", prevCampus: "strand", nextCampus: "guys", transitMins: 10, freeAfterTransit: 0 }, durationLabel: "10m" });
    expect(screen.queryByRole("button", { name: /Start /i })).toBeNull();
    expect(screen.getByText(/0m free after/i)).toBeInTheDocument();
  });

  it("propagates outer clicks for transit campus cards", () => {
    const outerClick = vi.fn();
    renderFreeRow({ gapContext: { type: "transit", prevCampus: "strand", nextCampus: "waterloo", transitMins: 12 }, durationLabel: "30m" }, outerClick);
    fireEvent.click(screen.getByText(/strand/i).closest("div"));
    expect(outerClick).toHaveBeenCalled();
    expect(screen.getByText(/12m travel · 30m gap/i)).toBeInTheDocument();
  });

  it("falls back to generic campus copy when campuses are unknown", () => {
    renderFreeRow({ gapContext: { type: "transit", prevCampus: "unknown", nextCampus: "mystery", transitMins: 8 }, durationLabel: "18m" });
    expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
    expect(screen.getByText(/8m travel · 18m gap/i)).toBeInTheDocument();
  });

  it("renders evening and personal copy variants", () => {
    const { rerender } = renderFreeRow({ gapContext: { type: "evening" }, durationLabel: "60m" });
    expect(screen.getByText("Reset")).toBeInTheDocument();
    rerender(
      <div>
        <PlanFreeRowContent styles={styles} gapContext={{ type: "personal" }} durationLabel="15m"
          assignedTask={null} candidateTask={null} isBestGap={false} onSkipTask={vi.fn()} onStartTask={vi.fn()} />
      </div>,
    );
    expect(screen.getByText("Short breather")).toBeInTheDocument();
  });

  it("highlights best gap candidate tasks with warning title", () => {
    renderFreeRow({
      durationLabel: "35m",
      candidateTask: { title: "Late essay", due_date: "2000-01-01T00:00:00Z", estimated_minutes: 35 },
      isBestGap: true,
    });
    expect(screen.getByText(/Late essay/)).toHaveAttribute("title", "❗ Late essay");
    expect(screen.queryByLabelText("Skip Late essay")).toBeNull();
  });

  it("allows skipping low-priority candidate tasks", () => {
    const onSkipTask = vi.fn();
    renderFreeRow({ durationLabel: "22m", candidateTask: { id: 17, title: "Reading", priority: "low", estimated_minutes: 20 }, onSkipTask });
    fireEvent.click(screen.getByLabelText("Skip Reading"));
    expect(onSkipTask).toHaveBeenCalledWith(17);
  });

  it("shows default short breather copy when no candidate task exists", () => {
    renderFreeRow({ durationLabel: "12m" });
    expect(screen.getByText("12m")).toBeInTheDocument();
    expect(screen.getByText("Short breather")).toHaveAttribute("title", "Short breather");
  });
});

describe("timeline row layout helpers", () => {
  it("applies spacing, min height, and custom classes", () => {
    const { container } = render(
      <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={44} rowClassName="extra-row">
        <span>child</span>
      </TimelineRowLayout>,
    );
    const row = container.firstChild;
    expect(row).toHaveStyle({ marginTop: "12px", minHeight: "44px" });
    expect(row.className).toContain("extra-row");
  });

  it("toggles time labels and renders the spine cell", () => {
    const { container, rerender } = render(<TimelineGutter row={{ hideTimeLabel: true }} styles={styles} timeLabel="10:00" />);
    expect(container.querySelector(`.${styles.planTimelineTime}`)).toBeNull();
    rerender(<TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="10:00" />);
    expect(screen.getByText("10:00")).toBeInTheDocument();
    rerender(<TimelineSpineCell styles={styles} />);
    expect(container.querySelector(`.${styles.planTimelineSpineCell}`)).toBeTruthy();
  });
});

describe("row renderer, strip, and accent helpers", () => {
  it("renders the free row branch without fallback suggestions or assigned tasks", () => {
    render(
      <MiniTimelineRowRenderer
        row={{ id: "free-1", type: "free" }}
        rows={[]}
        props={defaultRendererProps}
      />,
    );
    expect(screen.getByText("free-row:free-1:0:none:no-next:false")).toBeInTheDocument();
  });

  it("renders the exported free-row helper directly", () => {
    render(
      renderMiniTimelineFreeRow(
        { id: "free-2", type: "free" },
        { ...defaultRendererProps, onQuickStart: vi.fn(), onSkipGapTask: vi.fn(), setSlotPopoverRowId: vi.fn() },
      ),
    );
    expect(screen.getByText("free-row:free-2:0:none:no-next:false")).toBeInTheDocument();
  });

  it("renders break mode timer strip with session in progress", () => {
    render(<NowStrip hasTimerSession timerMode="break" timerTask="" styles={styles} />);
    expect(screen.getByText("Break")).toBeInTheDocument();
    expect(screen.getByText("Session in progress")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("renders current-block strip with sleep overlap badge on rerender", () => {
    doesEventOverlapSleepWindow.mockReturnValueOnce(true);
    render(
      <NowStrip
        hasTimerSession={false}
        currentBlock={{ title: "🔥 Night block", start_time: "2026-03-28T22:00:00", end_time: "2026-03-28T23:00:00" }}
        sleepWindow={{ sleepTime: "", wakeTime: "" }}
        styles={styles}
      />,
    );
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("Night block 😴")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  it("covers nullish event accent context fallbacks", () => {
    expect(getEventAccentColor(undefined, undefined)).toBeTruthy();
    expect(getEventAccentColor(undefined, "study")).toBeTruthy();
  });
});
