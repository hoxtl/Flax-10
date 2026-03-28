import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const getDayCountMock = vi.fn();
const addDeadlineAddedMock = vi.fn();
const addReadingAddedMock = vi.fn();

vi.mock("../../../../components/modules/deadlines/upcomingDeadlinesUtils", () => ({
  getDayCount: (...args) => getDayCountMock(...args),
}));

vi.mock("../../../../components/modules/shared/taskButtons.jsx", () => ({
  AddDeadlineToTasksButton: ({ deadline, onAdded }) => (
    <button onClick={() => { addDeadlineAddedMock(deadline.id); onAdded(deadline.id); }}>
      Add deadline
    </button>
  ),
  AddReadingToTasksButton: ({ readingId, onAdded }) => (
    <button onClick={() => { addReadingAddedMock(readingId); onAdded(readingId); }}>
      Add reading
    </button>
  ),
}));

import SmartNudge from "../../../../pages/modules/components/SmartNudge";

describe("ModulesPageNudges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows imminent deadline nudges and handles adding them", () => {
    getDayCountMock.mockImplementation((d) => (d === "t" ? 0 : 1));
    render(<SmartNudge deadlines={[{ id: 1, assessment_title: "E", start_due_date: "t" }]} readings={[]} onReadingAdded={vi.fn()} />);
    expect(screen.getByText(/E/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add deadline"));
    expect(addDeadlineAddedMock).toHaveBeenCalledWith(1);
  });

  it("shows reading nudges when deadlines are handled or missing", () => {
    getDayCountMock.mockImplementation(() => 1);
    const onReadingAdded = vi.fn();
    render(<SmartNudge deadlines={[]} readings={[{ id: 2, title: "C", deadline: "tom" }]} onReadingAdded={onReadingAdded} />);
    expect(screen.getByText(/C/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add reading"));
    expect(addReadingAddedMock).toHaveBeenCalledWith(2);
  });

  it("returns nothing when deadlines and readings are missing", () => {
    getDayCountMock.mockImplementation(() => 1);
    const { container } = render(<SmartNudge deadlines={undefined} readings={undefined} onReadingAdded={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses deadline-title and due-date fallbacks, then hides nudges after they are dismissed", () => {
    getDayCountMock.mockImplementation((value) => {
      if (value === "reading-date") return 0;
      if (value === "deadline-date") return 2;
      return 20;
    });

    const onReadingAdded = vi.fn();

    render(
      <SmartNudge
        deadlines={[{ id: 7, title: "Fallback title", start_due_date: "deadline-date" }]}
        readings={[{ id: 9, title: "Reading fallback", due_date: "reading-date" }]}
        onReadingAdded={onReadingAdded}
      />
    );

    expect(screen.getByText(/Reading fallback/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add reading"));
    expect(onReadingAdded).toHaveBeenCalledWith(9);
    expect(screen.getByText(/Fallback title/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add deadline"));
    expect(screen.queryByText(/Fallback title/)).not.toBeInTheDocument();
  });
});
