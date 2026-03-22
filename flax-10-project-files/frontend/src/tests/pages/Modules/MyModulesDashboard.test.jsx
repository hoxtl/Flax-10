/*
 * Tests for MyModulesDashboard page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import MyModulesDashboard from "../../../pages/Modules/MyModulesDashboard";
import { getUpcomingDeadlines } from "../../../api/calendar/deadlineApi";
import { getSuggestedReadings, convertReadingToTask } from "../../../api/tasks/readingApi";
import { createTask } from "../../../api/tasks/taskApi";

vi.mock("../../../api/calendar/deadlineApi", () => ({
  getUpcomingDeadlines: vi.fn(),
}));

vi.mock("../../../api/tasks/readingApi", () => ({
  getSuggestedReadings: vi.fn(),
  convertReadingToTask: vi.fn(),
}));

vi.mock("../../../api/tasks/taskApi", () => ({
  createTask: vi.fn(),
}));

const toastMock = vi.fn();
vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

vi.mock("../../../pages/Tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: () => null,
}));

const NUDGE_DEADLINE = {
  id: 12,
  module: 42,
  assessment_title: "Renal Physiology KEATS Quiz",
  module_code: "LS4404",
  module_name: "Renal Physiology",
  start_due_date: "2026-03-23T10:00:00Z",
  description: "Quiz prep",
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <MyModulesDashboard modules={[]} enrollments={[]} />
    </MemoryRouter>
  );
}

describe("MyModulesDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertReadingToTask.mockResolvedValue({});
    createTask.mockResolvedValue({});
  });

  it("reveals the extra upcoming deadlines when the dropdown is expanded", async () => {
    getUpcomingDeadlines.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        id: index + 1,
        assessment_title: `Deadline ${index + 1}`,
        module_code: `MA4${index + 1}01`,
        deadline_type: "coursework",
        start_due_date: `2026-03-${21 + index}T10:00:00Z`,
      }))
    );
    getSuggestedReadings.mockResolvedValue([]);

    renderDashboard();

    expect(await screen.findByText("Deadline 1")).toBeInTheDocument();
    expect(screen.queryByText("Deadline 5")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ 2 more/i }));

    expect(await screen.findByText("Deadline 5")).toBeInTheDocument();
    expect(screen.getByText("Deadline 6")).toBeInTheDocument();
  });

  it("shows and expands the reading list overflow separately", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        id: index + 1,
        title: `Reading ${index + 1}`,
        module_name: "",
        module_code: `PH4${index + 1}05`,
        deadline: `2026-03-${21 + index}T10:00:00Z`,
      }))
    );

    renderDashboard();

    expect(await screen.findByText("Reading 1")).toBeInTheDocument();
    expect(screen.queryByText("Reading 5")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ 2 more/i }));

    expect(await screen.findByText("Reading 5")).toBeInTheDocument();
    expect(screen.getByText("Reading 6")).toBeInTheDocument();
  });

  it("shows an add-to-tasks button in the smart nudge banner for deadlines", async () => {
    getUpcomingDeadlines.mockResolvedValue([NUDGE_DEADLINE]);
    getSuggestedReadings.mockResolvedValue([]);
    renderDashboard();

    const addButton = await screen.findByRole("button", { name: /\+ add to tasks/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        title: "Renal Physiology KEATS Quiz",
        module: 42,
        module_code: "LS4404",
        due_date: "2026-03-23T10:00:00Z",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith("Deadline added to tasks!");
  });
});
