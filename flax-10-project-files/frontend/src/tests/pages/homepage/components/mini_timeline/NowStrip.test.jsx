import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NowStrip } from "@/pages/homepage/components/mini_timeline/NowStrip";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  formatTime: (t) => "13:00",
}));
vi.mock("@/pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (t) => t,
}));
vi.mock("@/components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: vi.fn(() => false),
}));

const styles = {
  planTimelineNowStrip: "strip",
  planTimelineNowStripDot: "dot",
  planTimelineNowStripLabel: "label",
  planTimelineNowStripTask: "task",
  planTimelineNowStripTimer: "timer",
};

describe("NowStrip", () => {
  it("renders null when no timer and no currentBlock", () => {
    const { container } = render(<NowStrip styles={styles} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Focus label for timer work mode", () => {
    render(<NowStrip hasTimerSession timerMode="work" timerTask="Task A" timeLeft={1500} styles={styles} />);
    expect(screen.getByText("Focus")).toBeTruthy();
    expect(screen.getByText("Task A")).toBeTruthy();
    expect(screen.getByText("25:00")).toBeTruthy();
  });

  it("renders Break label for timer break mode", () => {
    render(<NowStrip hasTimerSession timerMode="break" timeLeft={300} styles={styles} />);
    expect(screen.getByText("Break")).toBeTruthy();
    expect(screen.getByText("Session in progress")).toBeTruthy();
  });

  it("renders current block when no timer session", () => {
    const block = { title: "Lecture", end_time: "2026-03-28T14:00:00Z", start_time: "2026-03-28T13:00:00Z" };
    render(<NowStrip currentBlock={block} sleepWindow={{ sleepTime: "23:00", wakeTime: "07:00" }} styles={styles} />);
    expect(screen.getByText("Now")).toBeTruthy();
    expect(screen.getByText("Lecture")).toBeTruthy();
  });

  it("shows 😴 when block overlaps sleep window", async () => {
    const { doesEventOverlapSleepWindow } = await import("@/components/settings/hooks/useSleepWarning");
    vi.mocked(doesEventOverlapSleepWindow).mockReturnValueOnce(true);
    const block = { title: "Late event", end_time: "T23:30:00Z", start_time: "T23:00:00Z" };
    render(<NowStrip currentBlock={block} styles={styles} />);
    expect(screen.getByText(/😴/)).toBeTruthy();
  });

  it("renders 00:00 when timeLeft is zero", () => {
    render(<NowStrip hasTimerSession timerMode="work" timeLeft={0} styles={styles} />);
    expect(screen.getByText("00:00")).toBeTruthy();
  });
});
