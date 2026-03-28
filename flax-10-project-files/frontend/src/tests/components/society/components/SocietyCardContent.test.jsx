import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { SocietyCardContent } from "../../../../components/society/components/SocietyCardContent";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("SocietyCardContent", () => {
  const society = {
    id: 5,
    name: "Robotics Society",
    member_count: 18,
    is_ratified: true,
    upcoming_events_count: 2,
    related_tasks_count: 3,
  };

  it("renders the overlay version when the card has no image", () => {
    renderWithRouter(<SocietyCardContent society={society} hasImage={false} RatifiedBadge={({ isRatified }) => <span>{String(isRatified)}</span>} />);

    expect(screen.getByText("Robotics Society")).toBeInTheDocument();
    expect(screen.getByText("18 members")).toBeInTheDocument();
    expect(screen.getByText(/2 event/)).toBeInTheDocument();
    expect(screen.getByText(/3 task/)).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("renders content without the overlay when an image exists", () => {
    renderWithRouter(<SocietyCardContent society={{ ...society, upcoming_events_count: 1, related_tasks_count: 1 }} hasImage RatifiedBadge={null} />);

    expect(screen.getByRole("link", { name: "Robotics Society" })).toHaveAttribute("href", "/societies?id=5");
    expect(screen.getByText(/1 event/)).toBeInTheDocument();
    expect(screen.getByText(/1 task/)).toBeInTheDocument();
  });

  it("falls back to event and task counts from alternate fields", () => {
    renderWithRouter(
      <SocietyCardContent
        society={{ ...society, upcoming_events_count: null, events_count: 4, related_tasks_count: null, tasks_count: 5 }}
        hasImage
        RatifiedBadge={null}
      />,
    );

    expect(screen.getByText(/4 events/)).toBeInTheDocument();
    expect(screen.getByText(/5 tasks/)).toBeInTheDocument();
  });

  it("builds the task link even when the society name is missing", () => {
    renderWithRouter(
      <SocietyCardContent
        society={{ ...society, name: "", upcoming_events_count: 1, related_tasks_count: 1 }}
        hasImage
        RatifiedBadge={null}
      />,
    );

    expect(screen.getByRole("link", { name: /1 task/ })).toHaveAttribute("href", "/tasks?society=");
    expect(screen.getByText(/1 event/)).toBeInTheDocument();
  });

  it("hides related links when counts are non-positive or missing", () => {
    renderWithRouter(
      <SocietyCardContent
        society={{ ...society, upcoming_events_count: null, events_count: null, events: [], related_tasks_count: null, tasks_count: 0 }}
        hasImage
        RatifiedBadge={null}
      />,
    );

    expect(screen.getByText("18 members")).toBeInTheDocument();
    expect(screen.queryByText(/event/)).not.toBeInTheDocument();
    expect(screen.queryByText(/task/)).not.toBeInTheDocument();
  });

  it("treats non-array events as missing", () => {
    renderWithRouter(
      <SocietyCardContent
        society={{ ...society, upcoming_events_count: null, events_count: null, events: null, related_tasks_count: 1 }}
        hasImage
        RatifiedBadge={null}
      />,
    );

    expect(screen.queryByText(/event/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 task/)).toBeInTheDocument();
  });

  it("falls back to a missing task count when no task totals are provided", () => {
    renderWithRouter(
      <SocietyCardContent
        society={{ ...society, upcoming_events_count: 2, related_tasks_count: null, tasks_count: undefined }}
        hasImage
        RatifiedBadge={null}
      />,
    );

    expect(screen.getByText(/2 events/)).toBeInTheDocument();
    expect(screen.queryByText(/task/)).not.toBeInTheDocument();
  });
});
