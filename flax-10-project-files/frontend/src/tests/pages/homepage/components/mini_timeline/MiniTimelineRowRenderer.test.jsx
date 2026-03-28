import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniTimelineRowRenderer } from "@/pages/homepage/components/mini_timeline/MiniTimelineRowRenderer";

vi.mock("@/pages/homepage/components/mini_timeline/HourMarkRow", () => ({
  HourMarkRow: () => <div data-testid="hour-mark" />,
}));

vi.mock("@/pages/homepage/components/mini_timeline/TinyGapRow", () => ({
  TinyGapRow: () => <div data-testid="tiny-gap" />,
}));

vi.mock("@/pages/homepage/components/mini_timeline/NowRow", () => ({
  NowRow: () => <div data-testid="now-row" />,
}));

vi.mock("@/pages/homepage/components/mini_timeline/PlanFreeRow", () => ({
  PlanFreeRow: ({ deadlineSuggestions }) => (
    <div data-testid="plan-free">{deadlineSuggestions?.length ? "has-fallback" : "no-fallback"}</div>
  ),
}));

vi.mock("@/pages/homepage/components/mini_timeline/ConflictPairRow", () => ({
  ConflictPairRow: () => <div data-testid="conflict-pair" />,
}));

vi.mock("@/pages/homepage/components/mini_timeline/PlanEventRow", () => ({
  PlanEventRow: () => <div data-testid="plan-event" />,
}));

const styles = { a: "a" };
const baseProps = {
  assignedGapTasks: { map: {}, nextMap: {} },
  attachNowRow: vi.fn(),
  bestFreeRowId: "g1",
  gapDeadlineFallbacks: {},
  getTag: vi.fn(),
  onCardClick: vi.fn(),
  onConflictAutoMove: vi.fn(),
  onEdit: vi.fn(),
  onEventContextMenu: vi.fn(),
  onQuickStart: vi.fn(),
  onPushTomorrow: vi.fn(),
  onSkipGapTask: vi.fn(),
  selectedDate: new Date(),
  setConflictPopoverRowId: vi.fn(),
  setSlotPopoverRowId: vi.fn(),
  sleepWindow: null,
  slotPopoverRef: { current: null },
  slotPopoverRowId: null,
  styles,
};

describe("MiniTimelineRowRenderer", () => {
  it("renders static row variants for hour marks, gaps, and the now row", () => {
    const { rerender } = render(
      <MiniTimelineRowRenderer row={{ id: "h", type: "hourMark" }} rows={[]} props={baseProps} />,
    );
    expect(screen.getByTestId("hour-mark")).toBeInTheDocument();

    rerender(<MiniTimelineRowRenderer row={{ id: "tg", type: "tinyGap" }} rows={[]} props={baseProps} />);
    expect(screen.getByTestId("tiny-gap")).toBeInTheDocument();

    rerender(<MiniTimelineRowRenderer row={{ id: "n", type: "now" }} rows={[]} props={baseProps} />);
    expect(screen.getByTestId("now-row")).toBeInTheDocument();
  });

  it("delegates free rows, conflicts, and standard events to the specialised renderers", () => {
    const { rerender } = render(
      <MiniTimelineRowRenderer row={{ id: "f", type: "free" }} rows={[]} props={baseProps} />,
    );
    expect(screen.getByTestId("plan-free")).toBeInTheDocument();
    expect(screen.getByText("no-fallback")).toBeInTheDocument();

    rerender(<MiniTimelineRowRenderer row={{ id: "c", type: "eventGroup" }} rows={[]} props={baseProps} />);
    expect(screen.getByTestId("conflict-pair")).toBeInTheDocument();

    rerender(<MiniTimelineRowRenderer row={{ id: "e", type: "event" }} rows={[]} props={baseProps} />);
    expect(screen.getByTestId("plan-event")).toBeInTheDocument();
  });

  it("passes deadline fallback payloads into free rows when the map supplies them", () => {
    const dl = { id: "d1", title: "Revision" };
    render(
      <MiniTimelineRowRenderer
        row={{ id: "gap-a", type: "free" }}
        rows={[]}
        props={{ ...baseProps, gapDeadlineFallbacks: { "gap-a": dl } }}
      />,
    );
    expect(screen.getByText("has-fallback")).toBeInTheDocument();
  });
});
