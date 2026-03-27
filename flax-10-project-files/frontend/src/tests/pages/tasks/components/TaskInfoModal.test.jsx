import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../../../api/readingApi", () => ({
  getReadingSpeed: vi.fn(),
}));

import { TaskInfoModal } from "../../../../pages/tasks/components/TaskInfoModal";
import { getReadingSpeed } from "../../../../api/readingApi";

describe("TaskInfoModal coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not request reading speed when there is no reading context", () => {
    render(
      <TaskInfoModal
        task={{ id: 1, title: "Essay", priority: "medium", estimated_blocks: 2, due_date: null }}
        listName="Inbox"
        onClose={vi.fn()}
      />,
    );

    expect(getReadingSpeed).not.toHaveBeenCalled();
    expect(screen.queryByText("Chapter")).not.toBeInTheDocument();
  });

  it("shows page ranges and module-name fallbacks for reading tasks", async () => {
    getReadingSpeed.mockResolvedValue({ avg_min_per_page: 2, is_personalised: false });
    render(
      <TaskInfoModal
        task={{ id: 2, title: "Read chapter", description: "", priority: "urgent", due_date: "2026-03-15T10:00:00Z", estimated_blocks: 3, module_name: "Machine Learning", reading_chapter: "Week 4", reading_start_page: 10, reading_end_page: 18 }}
        listName="Reading List - Machine Learning" onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(getReadingSpeed).toHaveBeenCalled());
    expect(screen.getByText("Week 4")).toBeInTheDocument();
    expect(screen.getByText("pp. 10–18")).toBeInTheDocument();
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("2.0 min/page")).toBeInTheDocument();
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
  });

  it("handles reading-speed failures and missing-value fallbacks outside reading lists", async () => {
    const onClose = vi.fn(); getReadingSpeed.mockRejectedValueOnce(new Error("offline"));
    render(
      <TaskInfoModal
        task={{ id: 3, title: "", description: "Bring notes", priority: null, due_date: null, estimated_blocks: 1, module_code: "CS300", module_name: "Compilers", page_count: 12 }}
        listName="Inbox" onClose={onClose}
      />
    );

    await waitFor(() => expect(getReadingSpeed).toHaveBeenCalled());
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Bring notes")).toBeInTheDocument();
    expect(screen.getByText("12 pages")).toBeInTheDocument();
    expect(screen.queryByText("Speed")).not.toBeInTheDocument();
    expect(screen.getByText("CS300 — Compilers")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows optional chapter pills without pages when the task is not in a reading list", () => {
    render(
      <TaskInfoModal
        task={{
          id: 4,
          title: "Skim notes",
          description: "",
          priority: "medium",
          due_date: null,
          estimated_blocks: 1,
          reading_chapter: "Week 6",
        }}
        listName="Inbox"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Week 6")).toBeInTheDocument();
    expect(screen.queryByText("Pages")).not.toBeInTheDocument();
  });

  it("shows reading speed outside reading lists when page counts are present", async () => {
    getReadingSpeed.mockResolvedValueOnce({ avg_min_per_page: 1.5 });

    render(
      <TaskInfoModal
        task={{
          id: 5,
          title: "Read handout",
          description: "",
          priority: "medium",
          due_date: null,
          estimated_blocks: 1,
          page_count: 12,
          module_code: "CS111",
        }}
        listName="Inbox"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(getReadingSpeed).toHaveBeenCalled());
    expect(await screen.findByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("1.5 min/page")).toBeInTheDocument();
  });

  it("shows reading-list placeholders and omits the list row when no list name is provided", async () => {
    getReadingSpeed.mockResolvedValueOnce({});

    render(
      <TaskInfoModal
        task={{
          id: 6,
          title: "Reading prep",
          description: "",
          priority: "medium",
          due_date: null,
          estimated_blocks: 1,
        }}
        listName="Reading List - Philosophy"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(getReadingSpeed).toHaveBeenCalled());
    expect(screen.getAllByText("—").length).toBeGreaterThan(1);
  });

  it("omits the list information row when listName is missing", () => {
    render(
      <TaskInfoModal
        task={{ id: 7, title: "Essay plan", priority: "medium", estimated_blocks: 1, due_date: null }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText(/^List$/)).not.toBeInTheDocument();
  });
});
