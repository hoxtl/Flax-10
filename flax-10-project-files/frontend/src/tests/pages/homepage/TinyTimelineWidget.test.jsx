import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TinyTimelineWidget from "../../../pages/homepage/components/TinyTimelineWidget";

const navigateMock = vi.fn();

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
});
