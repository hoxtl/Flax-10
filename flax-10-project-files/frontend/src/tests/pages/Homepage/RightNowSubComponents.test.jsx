import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { animate, initial, layout, transition, exit, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("lucide-react", () => ({
  Train: () => <svg aria-hidden="true" />,
  AlertTriangle: () => <svg aria-hidden="true" />,
  X: () => <svg aria-hidden="true" />,
  MapPinned: () => <svg aria-hidden="true" />,
  ArrowUpRight: () => <svg aria-hidden="true" />,
}));

vi.mock("../../../pages/homepage/components/rightNowUtils", () => ({
  getJourneySummary: vi.fn((journey) => journey),
  getTimeLeftBand: vi.fn((minutes) => {
    if (minutes == null) return null;
    if (minutes < 10) return "under10";
    if (minutes <= 30) return "10to30";
    return "later";
  }),
}));

import {
  ActiveEventCard,
  CommuteContextCard,
  ConflictSummary,
  TflDelayCard,
  fadeIn,
} from "../../../pages/homepage/components/RightNowSubComponents";

describe("RightNowSubComponents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns fade-in motion props", () => {
    expect(fadeIn(0.5)).toEqual({
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35, delay: 0.5, ease: [0.23, 1, 0.32, 1] },
    });
  });

  it("renders active event card with progress, range, and urgency colour band", () => {
    const { rerender } = render(
      <ActiveEventCard
        currentBlock={{ title: "Deep Work", end_time: "2026-03-24T10:05:00.000Z" }}
        timeRangeStr="09:30 - 10:30"
        timeLeftStr="5m left"
        currentProgressPct={75}
      />,
    );

    expect(screen.getByText("Deep Work")).toBeInTheDocument();
    expect(screen.getByText("5m left")).toHaveStyle({ color: "var(--home-urgency-danger)" });
    expect(screen.getByText("09:30 - 10:30")).toBeInTheDocument();

    rerender(
      <ActiveEventCard
        currentBlock={{ title: "Lecture", end_time: "2026-03-24T10:20:00.000Z" }}
        timeRangeStr="10:00 - 11:00"
        timeLeftStr="20m left"
        currentProgressPct={50}
      />,
    );
    expect(screen.getByText("20m left")).toHaveStyle({ color: "var(--home-urgency-warning)" });
  });

  it("renders and dismisses the TFL delay card", () => {
    const onDismiss = vi.fn();
    render(<TflDelayCard leaveByInfo={{ message: "Leave in 12 minutes" }} onDismiss={onDismiss} />);

    expect(screen.getByText("Leave in 12 minutes")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Dismiss delay alert"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders conflict labels for timed and untimed overlaps", () => {
    const { rerender } = render(
      <ConflictSummary conflicts={[{ a: { start_time: "2026-03-24T14:30:00.000Z" }, b: {} }]} onDismiss={vi.fn()} />,
    );
    expect(screen.getByText(/Warning: Schedule overlap at 14:30/)).toBeInTheDocument();

    rerender(<ConflictSummary conflicts={[{ a: {}, b: {} }, { a: {}, b: {} }]} onDismiss={vi.fn()} />);
    expect(screen.getByText("2 schedule overlaps today")).toBeInTheDocument();
  });

  it("renders commute context card in loading and success states", () => {
    const { rerender } = render(
      <MemoryRouter>
        <CommuteContextCard campus={{ shortName: "WAT", name: "Waterloo" }} journey={{ duration: "28 min", lines: ["Northern"] }} loading leaveByInfo={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText("WAT commute")).toBeInTheDocument();
    expect(screen.getByText("Checking route...")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CommuteContextCard campus={{ shortName: "STR", name: "Strand" }} journey={{ duration: "18 min", lines: ["Circle", "District"] }} loading={false} leaveByInfo={{ leaveByStr: "10:20" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Leave by 10:20 for Strand/)).toBeInTheDocument();
    expect(screen.getByText("Circle")).toBeInTheDocument();
    expect(screen.getByText("District")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open map/i })).toHaveAttribute("href", "/map");
  });

  it("renders commute context card with secondary campus fallbacks", () => {
    render(
      <MemoryRouter>
        <CommuteContextCard campus={null} journey={{ duration: "35 min", lines: [] }} loading={false} leaveByInfo={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Campus commute")).toBeInTheDocument();
    expect(screen.getByText("35 min from home.")).toBeInTheDocument();
  });

  it("renders commute context card in empty or error states", () => {
    render(
      <MemoryRouter>
        <CommuteContextCard campus={null} journey={null} loading={false} leaveByInfo={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Check travel.")).toBeInTheDocument();
  });
});
