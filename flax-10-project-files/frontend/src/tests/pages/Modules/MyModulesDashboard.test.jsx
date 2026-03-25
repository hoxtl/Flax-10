/*
 * Tests for MyModulesDashboard page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const {
            animate: _animate,
            exit: _exit,
            initial: _initial,
            layout: _layout,
            layoutId: _layoutId,
            layoutRoot: _layoutRoot,
            transition: _transition,
            variants: _variants,
            whileHover: _whileHover,
            whileTap: _whileTap,
            ...rest
          } = props;

          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

import MyModulesDashboard from "../../../pages/Modules/MyModulesDashboard";
import { getUpcomingDeadlines } from "../../../api/deadlineApi";
import { getSuggestedReadings, convertReadingToTask } from "../../../api/readingApi";
import { createTask } from "../../../api/taskApi";
import { AddReadingToTasksButton } from "../../../components/Modules/shared/taskButtons.jsx";

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: vi.fn(),
}));

vi.mock("../../../api/readingApi", () => ({
  getSuggestedReadings: vi.fn(),
  convertReadingToTask: vi.fn(),
}));

vi.mock("../../../api/taskApi", () => ({
  createTask: vi.fn(),
}));

vi.mock("../../../components/Modules/shared/taskButtons.jsx", async () => {
  const actual = await vi.importActual("../../../components/Modules/shared/taskButtons.jsx");
  return {
    ...actual,
    AddReadingToTasksButton: vi.fn(actual.AddReadingToTasksButton),
  };
});

const toastMock = vi.fn();
const taskInfoModalMock = vi.fn();
vi.mock("../../../hooks/useCountUp", () => ({
  useCountUp: () => ({ current: null }),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

vi.mock("../../../pages/Tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: (props) => {
    taskInfoModalMock(props);
    return <div data-testid="task-info-modal">{props.task?.title}</div>;
  },
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
    taskInfoModalMock.mockClear();
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
    expect(await screen.findByTestId("task-info-modal")).toHaveTextContent("Intro: Chapter 3");
    expect(taskInfoModalMock).toHaveBeenCalledWith(expect.objectContaining({
      task: expect.objectContaining({
        title: "Intro: Chapter 3",
        reading_start_page: 1,
        reading_end_page: 20,
        page_count: 20,
      }),
      listName: "Intro",
    }));
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

  it("removes a reading from the dashboard after it is added to tasks", async () => {
    getUpcomingDeadlines.mockResolvedValue([]);
    getSuggestedReadings.mockResolvedValue([
      { id: 8, title: "Seminar Notes", module_name: "", module_code: "CS101", deadline: "2026-04-10T00:00:00Z" },
    ]);

    renderDashboard();

    expect(await screen.findByText("Seminar Notes")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /\+ add/i }));

    await waitFor(() => {
      expect(screen.queryByText("Seminar Notes")).not.toBeInTheDocument();
    });
  });

  it("falls back to empty dashboard data when the loaders fail", async () => {
    getUpcomingDeadlines.mockRejectedValueOnce(new Error("deadline fail"));
    getSuggestedReadings.mockRejectedValueOnce(new Error("reading fail"));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No readings assigned/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});
