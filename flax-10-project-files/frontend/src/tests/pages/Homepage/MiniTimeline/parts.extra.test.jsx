import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  RotateCw: () => <svg data-testid="rotate-icon" />,
}));

vi.mock("../../../pages/Homepage/utils/dateFormatUtils", () => ({
  fmtDurationShort: (value) => `${value}m`,
  formatTime: (value) => (value ? value.slice(11, 16) : ""),
}));

vi.mock("../../../pages/Homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => String(title || "").replace("🔥 ", ""),
}));

const styles = new Proxy({}, { get: (_, key) => key });

import {
  ConflictPopover,
  EventDuration,
  EventTagSlot,
} from "../../../../pages/Homepage/components/MiniTimeline/parts/PlanEventRowParts";
import { ConflictActions, ConflictCard } from "../../../../pages/Homepage/components/MiniTimeline/parts/ConflictPairParts";
import { PlanFreeRowContent } from "../../../../pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "../../../../pages/Homepage/components/MiniTimeline/parts/TimelineRowLayout";

describe("mini timeline parts extras", () => {
  it("covers tag slot list pill, overlap controls, and duration helper", () => {
    const onToggleConflictPopover = vi.fn();
    const { rerender } = render(
      <EventTagSlot
        styles={styles}
        isOverlap
        isReadOnly={false}
        rowId="row-1"
        moduleCode=""
        matchTask={{ task_list: 2 }}
        taskLists={[{ id: 2, name: "Urgent" }]}
        accentColor="#00aa00"
        onToggleConflictPopover={onToggleConflictPopover}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reschedule to next free window" }));
    expect(onToggleConflictPopover).toHaveBeenCalledWith("row-1");
    expect(screen.getByText("Urgent").closest("a")).toHaveAttribute("href", "/tasks?list=2");

    rerender(
      <EventTagSlot
        styles={styles}
        isOverlap
        isReadOnly
        rowId="row-2"
        moduleCode="CS101"
        matchTask={null}
        taskLists={[]}
        accentColor="#336699"
        onToggleConflictPopover={onToggleConflictPopover}
      />,
    );
    expect(screen.queryByRole("button", { name: "Reschedule to next free window" })).toBeNull();
    expect(screen.getByText("CS101")).toBeInTheDocument();

    const { rerender: rerenderDuration, container } = render(<EventDuration styles={styles} durationMins={0} />);
    expect(container.firstChild).toBeNull();
    rerenderDuration(<EventDuration styles={styles} durationMins={45} />);
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("covers conflict popover branches and conflict pair actions", () => {
    const onAutoReschedule = vi.fn();
    const onMoveTomorrow = vi.fn();
    const onEdit = vi.fn();
    const { rerender } = render(
      <ConflictPopover styles={styles} nextFreeRow={null} onAutoReschedule={onAutoReschedule} onMoveTomorrow={onMoveTomorrow} onEdit={onEdit} />,
    );
    expect(screen.getByRole("button", { name: /No free window/i })).toBeDisabled();
    fireEvent.click(screen.getByText("→ Move to tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();

    rerender(
      <ConflictPopover styles={styles} nextFreeRow={{ id: "gap" }} onAutoReschedule={onAutoReschedule} onMoveTomorrow={onMoveTomorrow} onEdit={onEdit} />,
    );
    fireEvent.click(screen.getByText("Auto-move to next gap"));
    fireEvent.click(screen.getByText("Manually adjust"));
    expect(onAutoReschedule).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();

    const items = [
      { id: "a", item: { title: "🔥 Lecture", tag: "x" }, isReadOnly: false },
      { id: "b", item: { title: "Read only", tag: null }, isReadOnly: true },
    ];
    const onAutoMove = vi.fn();
    const onActionEdit = vi.fn();
    render(
      <ConflictActions
        styles={styles}
        items={items}
        freeRow={null}
        movable={items[0]}
        onAutoMove={onAutoMove}
        onEdit={onActionEdit}
      />,
    );
    expect(screen.getByText("2 events overlap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No free window" })).toBeDisabled();
    fireEvent.click(screen.getByTitle("Edit Lecture"));
    expect(onActionEdit).toHaveBeenCalledWith(items[0].item, "x");
  });

  it("covers conflict card keyboard, move-tomorrow, and time formatting", () => {
    const onContextMenu = vi.fn();
    const onActivate = vi.fn();
    const onMoveTomorrow = vi.fn();
    render(
      <ConflictCard
        itemRow={{ item: { title: "🔥 Clash", start_time: "2024-03-08T10:00:00", end_time: "2024-03-08T11:30:00" } }}
        styles={styles}
        accent="#ff0000"
        isSleepTime
        onContextMenu={onContextMenu}
        onActivate={onActivate}
        onMoveTomorrow={onMoveTomorrow}
        canMoveTomorrow
      />,
    );

    const card = screen.getByText("Clash").closest('[role="button"]');
    fireEvent.contextMenu(card);
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    fireEvent.click(screen.getByText("→ Move to tomorrow"));

    expect(onContextMenu).toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(onMoveTomorrow).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Scheduled during sleep hours")).toBeInTheDocument();
    expect(screen.getByText("10:00–11:30")).toBeInTheDocument();
  });

  it("covers free-row content variants and layout helpers", () => {
    const onSkipTask = vi.fn();
    const onStartTask = vi.fn();
    const outerClick = vi.fn();
    const { rerender } = render(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "study" }}
          durationLabel="45m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText("Short breather")).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "transit-partial", prevCampus: "unknown", nextCampus: "other", transitMins: 15, freeAfterTransit: 20 }}
          durationLabel="20m"
          assignedTask={{ id: 9, title: "Urgent task", priority: "urgent", estimated_minutes: 25 }}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    fireEvent.click(screen.getByLabelText("Skip Urgent task"));
    fireEvent.click(screen.getByLabelText("Start Urgent task"));
    expect(onSkipTask).toHaveBeenCalledWith(9);
    expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Urgent task" }));
    expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
    expect(screen.getByText(/20m free after/i)).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "transit-partial", prevCampus: "strand", nextCampus: "guys", transitMins: 10, freeAfterTransit: 0 }}
          durationLabel="10m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.queryByRole('button', { name: /Start /i })).toBeNull();
    expect(screen.getByText(/0m free after/i)).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "transit", prevCampus: "strand", nextCampus: "waterloo", transitMins: 12 }}
          durationLabel="30m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    fireEvent.click(screen.getByText(/strand/i).closest("div"));
    expect(outerClick).toHaveBeenCalled();
    expect(screen.getByText(/12m travel · 30m gap/i)).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "transit", prevCampus: "unknown", nextCampus: "mystery", transitMins: 8 }}
          durationLabel="18m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
    expect(screen.getByText(/8m travel · 18m gap/i)).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "evening" }}
          durationLabel="60m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText("Reset")).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "personal" }}
          durationLabel="15m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText("Short breather")).toBeInTheDocument();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "study" }}
          durationLabel="35m"
          assignedTask={null}
          candidateTask={{ title: "Late essay", due_date: "2000-01-01T00:00:00Z", estimated_minutes: 35 }}
          isBestGap
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText(/Late essay/)).toHaveAttribute('title', '❗ Late essay');
    expect(screen.getByText('(25m)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Skip Late essay')).toBeNull();

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "study" }}
          durationLabel="22m"
          assignedTask={null}
          candidateTask={{ id: 17, title: "Reading", priority: "low", estimated_minutes: 20 }}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText('Reading')).toHaveAttribute('title', 'Reading');
    fireEvent.click(screen.getByLabelText('Skip Reading'));
    expect(onSkipTask).toHaveBeenCalledWith(17);

    rerender(
      <div onClick={outerClick}>
        <PlanFreeRowContent
          styles={styles}
          gapContext={{ type: "study" }}
          durationLabel="12m"
          assignedTask={null}
          candidateTask={null}
          isBestGap={false}
          onSkipTask={onSkipTask}
          onStartTask={onStartTask}
        />
      </div>,
    );
    expect(screen.getByText('12m')).toBeInTheDocument();
    expect(screen.getByText('Short breather')).toHaveAttribute('title', 'Short breather');

    const { container, rerender: rerenderLayout } = render(
      <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={44} rowClassName="extra-row">
        <span>child</span>
      </TimelineRowLayout>,
    );
    const row = container.firstChild;
    expect(row).toHaveStyle({ marginTop: "12px", minHeight: "44px" });
    expect(row.className).toContain("extra-row");

    rerenderLayout(<TimelineGutter row={{ hideTimeLabel: true }} styles={styles} timeLabel="10:00" />);
    expect(container.querySelector(`.${styles.planTimelineTime}`)).toBeNull();

    rerenderLayout(<TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="10:00" />);
    expect(screen.getByText('10:00')).toBeInTheDocument();

    rerenderLayout(<TimelineSpineCell styles={styles} />);
    expect(container.querySelector(`.${styles.planTimelineSpineCell}`)).toBeTruthy();

    rerenderLayout(
      <TimelineRowLayout row={{}} styles={styles} minHeight={20}>
        <span>plain</span>
      </TimelineRowLayout>,
    );
    expect(container.firstChild).toHaveStyle({ marginTop: '0px', minHeight: '20px' });
  });
});
