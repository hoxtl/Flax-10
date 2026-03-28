import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TinyTimelineWidget from "@/pages/homepage/components/TinyTimelineWidget";

const navigateMock = vi.fn();
const multiRowEvents = [
  { id: "late", title: "Slot F", start_time: "2026-03-24T14:00:00.000Z", end_time: "2026-03-24T14:30:00.000Z" },
  { id: "current", title: "Morning focus", start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:30:00.000Z" },
  { id: "b", title: "Slot B", start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T10:30:00.000Z" },
  { id: "a", title: "Slot A", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T09:30:00.000Z" },
  { id: "c", title: "Slot C", start_time: "2026-03-24T11:00:00.000Z", end_time: "2026-03-24T11:30:00.000Z" },
  { id: "d", title: "Slot D", start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T12:30:00.000Z" },
  { id: "e", title: "Slot E", start_time: "2026-03-24T13:00:00.000Z", end_time: "2026-03-24T13:30:00.000Z" },
];

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => navigateMock,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("lucide-react", () => ({
  Clock: () => <svg aria-hidden="true" />,
  Calendar: () => <svg aria-hidden="true" />,
  MapPin: () => <svg aria-hidden="true" />,
}));

describe("TinyTimelineWidget", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T10:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the current block, limits upcoming items by row, and links to the full plan", () => {
    render(
      <TinyTimelineWidget
        now={new Date("2026-03-24T10:30:00.000Z")}
        row={1}
        sortedEvents={[
          { id: "past", title: "Earlier", start_time: "2026-03-24T08:00:00.000Z", end_time: "2026-03-24T09:00:00.000Z" },
          { id: "current", title: "In Progress", start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z", location: "Library" },
          { id: "task", title: "Essay Draft", source: "task", start_time: "2026-03-24T11:30:00.000Z", end_time: "2026-03-24T12:00:00.000Z" },
          { id: "later", title: "Too Late", start_time: "2026-03-24T13:00:00.000Z", end_time: "2026-03-24T14:00:00.000Z" },
        ]}
      />,
    );

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Essay Draft")).toBeInTheDocument();
    expect(screen.queryByText("Too Late")).not.toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view my calendar/i }));
    expect(navigateMock).toHaveBeenCalledWith("/calendar");
  });

  it("renders the empty state when there are no remaining events", () => {
    render(<TinyTimelineWidget now={new Date("2026-03-24T10:30:00.000Z")} sortedEvents={[]} row={2} />);
    expect(screen.getByText("No events remaining today")).toBeInTheDocument();
  });

  it("falls back to default props when none are provided", () => {
    render(<TinyTimelineWidget />);
    expect(screen.getByText("No events remaining today")).toBeInTheDocument();
  });

  it("normalises non-date now values, honours explicit types, and keys rows without ids", () => {
    render(
      <TinyTimelineWidget
        now="not-a-date"
        row={5}
        sortedEvents={[
          { end_time: "2026-03-24T12:00:00.000Z", start_time: "2026-03-24T11:00:00.000Z", title: "Typed", type: "Workshop" },
          { end_time: "2026-03-24T14:00:00.000Z", start_time: "2026-03-24T13:00:00.000Z", title: "Later" },
        ]}
      />,
    );
    expect(screen.getByText("Workshop")).toBeInTheDocument();
  });

  it("lists upcoming-only events when no current block exists", () => {
    render(
      <TinyTimelineWidget
        now={new Date("2026-03-24T08:00:00.000Z")}
        row={2}
        sortedEvents={[
          { id: "next", title: "Morning plan", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: "later", title: "Afternoon", start_time: "2026-03-24T14:00:00.000Z", end_time: "2026-03-24T15:00:00.000Z" },
        ]}
      />,
    );
    expect(screen.getByText("Morning plan")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.getAllByText("Event")).toHaveLength(2);
  });

  it("sorts multi-row upcoming events and caps them at five entries", () => {
    vi.setSystemTime(new Date("2026-03-24T08:45:00.000Z"));
    render(<TinyTimelineWidget now={new Date("2026-03-24T08:30:00.000Z")} row={3} sortedEvents={multiRowEvents} />);
    const titles = screen.getAllByRole("heading", { level: 4 }).map((node) => node.textContent);
    expect(titles.slice(0, 6)).toEqual(["Morning focus", "Slot A", "Slot B", "Slot C", "Slot D", "Slot E"]);
    expect(screen.queryByText("Slot F")).toBeNull();
    vi.setSystemTime(new Date("2026-03-24T10:30:00.000Z"));
  });
});

describe("TinyTimelineWidget default export", () => {
  it("mirrors the named widget export", async () => {
    const mod = await import("@/pages/homepage/components/TinyTimelineWidget");
    expect(mod.default).toBe(mod.TinyTimelineWidget);
  });
});
