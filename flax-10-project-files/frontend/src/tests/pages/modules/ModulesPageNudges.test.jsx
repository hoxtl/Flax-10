import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const getDayCountMock = vi.fn();
const addDeadlineAddedMock = vi.fn();
const addReadingAddedMock = vi.fn();

vi.mock("../../../components/modules/deadlines/upcomingDeadlinesUtils", () => ({
  getDayCount: (...args) => getDayCountMock(...args),
}));

vi.mock("../../../components/modules/shared/taskButtons.jsx", () => ({
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

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/modules/ModulesPageNudges.test.jsx
import SmartNudge from "../../../pages/modules/components/SmartNudge";
=======
import SmartNudge from "../../../pages/modules/SmartNudge";
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Modules/ModulesPageNudges.test.jsx

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
});
