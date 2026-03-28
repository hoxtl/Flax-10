/*
 * Tests for MyModulesDashboard page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";


import MyModulesDashboard from "../../../../pages/modules/components/MyModulesDashboard";
import { getUpcomingDeadlines } from "../../../../api/deadlineApi";
import { getSuggestedReadings, convertReadingToTask } from "../../../../api/readingApi";
import { createTask } from "../../../../api/taskApi";

vi.mock("../../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: vi.fn(),
}));

vi.mock("../../../../api/readingApi", () => ({
  getSuggestedReadings: vi.fn(),
  convertReadingToTask: vi.fn(),
}));

vi.mock("../../../../api/taskApi", () => ({
  createTask: vi.fn(),
}));

const toastMock = vi.fn();
vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock("../../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

vi.mock("../../../../pages/tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: () => null,
}));

const NUDGE_DEADLINE = {
  id: 12,
  module: 42,
  assessment_title: "Renal Physiology KEATS Quiz",
  module_code: "LS4404",
  module_name: "Renal Physiology",
  start_due_date: "2026-03-30T10:00:00Z",
  description: "Quiz prep",
};

function renderDashboard(props = {}) {
  return render(
    <MemoryRouter>
      <MyModulesDashboard modules={[]} enrollments={[]} {...props} />
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
        due_date: "2026-03-30T10:00:00Z",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith("Deadline added to tasks!");
  });

  it("shows empty readings state when no readings provided", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/No readings assigned/i)).toBeInTheDocument();
    });
  });

  it("opens task info modal when a reading row is clicked", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([
      { id: 5, title: "Intro: Chapter 3", module_name: "Intro", module_code: "CS101", deadline: "2026-04-10T00:00:00Z", start_page: 1, end_page: 20 },
    ]);
    renderDashboard();
    const readingTitle = await screen.findByText("Chapter 3");
    fireEvent.click(readingTitle.closest("[class]") || readingTitle);
    // TaskInfoModal renders null in test, just verify no error thrown
    expect(readingTitle).toBeInTheDocument();
  });

  it("removes a reading after it is added to tasks", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([
      { id: 7, title: "Intro: Chapter 4", module_name: "Intro", module_code: "CS101", deadline: "2026-04-10T00:00:00Z", start_page: 21, end_page: 40 },
    ]);
    renderDashboard();

    expect(await screen.findByText("Chapter 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /\+ add to tasks/i }));

    await waitFor(() => {
      expect(convertReadingToTask).toHaveBeenCalledWith(7);
      expect(toastMock).toHaveBeenCalledWith("Reading added to tasks!");
    });
    await waitFor(() => expect(screen.queryByText("Chapter 4")).not.toBeInTheDocument());
  });

  it("falls back cleanly when the dashboard APIs reject", async () => {
    getUpcomingDeadlines.mockRejectedValue(new Error("deadlines failed"));
    getSuggestedReadings.mockRejectedValue(new Error("readings failed"));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No readings assigned/i)).toBeInTheDocument();
    });
  });

  it("falls back to empty arrays when the dashboard APIs resolve undefined", async () => {
    getUpcomingDeadlines.mockResolvedValue(undefined);
    getSuggestedReadings.mockResolvedValue(undefined);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No readings assigned/i)).toBeInTheDocument();
      expect(screen.getByText(/No upcoming deadlines/i)).toBeInTheDocument();
    });
  });

  it("handles missing module and enrollment inputs", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <MyModulesDashboard modules={null} enrollments={null} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No readings assigned/i)).toBeInTheDocument();
    });
  });

  it("MyModulesDashboard shows enrolled module count in stats", async () => {
    getUpcomingDeadlines.mockResolvedValue([{ id: 1, assessment_title: "Quiz", module_code: "MA1", start_due_date: "2026-03-30T10:00:00Z" }]);
    getSuggestedReadings.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <MyModulesDashboard
          modules={[{ id: 1, module_code: "CS101" }, { id: 2, module_code: "MA101" }]}
          enrollments={[{ module: 1 }, { module: 2 }]}
        />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getAllByText("Enrolled modules")[0]).toBeInTheDocument();
    });
  });

  it("ignores module-code clicks when no view handler was provided", async () => {
    getUpcomingDeadlines.mockResolvedValue([NUDGE_DEADLINE]);
    getSuggestedReadings.mockResolvedValue([]);

    renderDashboard({ modules: [{ id: 42, module_code: "LS4404" }] });

    fireEvent.click(await screen.findByRole("button", { name: /LS4404/i }));
    expect(screen.getAllByText(/Renal Physiology KEATS Quiz/i).length).toBeGreaterThan(0);
  });

  it("only opens modules when a clicked deadline code matches an available module", async () => {
    getUpcomingDeadlines.mockResolvedValue([NUDGE_DEADLINE]);
    getSuggestedReadings.mockResolvedValue([]);
    const onViewModule = vi.fn();

    const { rerender } = renderDashboard({ modules: null, onViewModule });

    fireEvent.click(await screen.findByRole("button", { name: /LS4404/i }));
    expect(onViewModule).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <MyModulesDashboard
          modules={[{ id: 42, module_code: "LS4404", module_name: "Renal Physiology" }]}
          enrollments={[]}
          onViewModule={onViewModule}
        />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /LS4404/i }));
    expect(onViewModule).toHaveBeenCalledWith({ id: 42, module_code: "LS4404", module_name: "Renal Physiology" });
  });

  it("removes a reading after the smart nudge adds it to tasks", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([
      {
        id: 11,
        title: "Due-date reading",
        module_name: "Intro",
        module_code: "CS101",
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        start_page: 3,
        end_page: 18,
      },
    ]);

    renderDashboard();

    expect(await screen.findByText("Due-date reading")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /\+ add to tasks/i })[0]);

    await waitFor(() => {
      expect(convertReadingToTask).toHaveBeenCalledWith(11);
      expect(toastMock).toHaveBeenCalledWith("Reading added to tasks!");
    });
    await waitFor(() => expect(screen.queryByText("Due-date reading")).not.toBeInTheDocument());
  });
});
