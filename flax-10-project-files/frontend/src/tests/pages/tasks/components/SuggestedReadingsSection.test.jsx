/* Tests for SuggestedReadingsSection component data fetching and rendering */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import SuggestedReadingsSection from "../../../../pages/tasks/components/SuggestedReadingsSection";
import { getSuggestedReadings, getReadingSpeed, convertReadingToTask } from "../../../../api/readingApi";

vi.mock("../../../../api/readingApi", () => ({
  getSuggestedReadings: vi.fn(),
  getReadingSpeed: vi.fn(),
  convertReadingToTask: vi.fn(),
}));

describe("SuggestedReadingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertReadingToTask.mockResolvedValue({});
    getReadingSpeed.mockResolvedValue({ is_personalised: true, avg_min_per_page: 1.6 });
  });

  it("keeps the active module label out of the section header", async () => {
    getSuggestedReadings.mockResolvedValue([
      {
        id: 1,
        title: "Core Principles",
        module_code: "PH4505",
        module_name: "Astrophysics",
        page_count: 45,
        deadline: "2026-03-24T10:00:00Z",
      },
    ]);

    render(
      <SuggestedReadingsSection
        activeList={{ id: 7, name: "PH4505 - Astrophysics" }}
        taskCount={1}
        pendingTasks={[{ id: 10, title: "Read chapter" }]}
        completedTasks={[]}
      />
    );

    expect(await screen.findByText("Suggested reading list")).toBeInTheDocument();
    expect(screen.getByText("Core Principles")).toBeInTheDocument();
    expect(screen.queryByText("PH4505 Astrophysics")).not.toBeInTheDocument();
  });

  it("shows the caught-up state only after the list's tasks are completed", async () => {
    getSuggestedReadings.mockResolvedValue([]);

    render(
      <SuggestedReadingsSection
        activeList={{ id: 9, name: "PH4505 - Astrophysics" }}
        taskCount={2}
        pendingTasks={[]}
        completedTasks={[{ id: 99, title: "Finished reading" }]}
      />
    );

    expect(await screen.findByText("All caught up on readings!")).toBeInTheDocument();
    expect(screen.getByText("No suggested readings left for PH4505 Astrophysics right now.")).toBeInTheDocument();
  });

  it("shows a neutral empty state when there are no suggestions but work is still pending", async () => {
    getSuggestedReadings.mockResolvedValue([]);

    render(
      <SuggestedReadingsSection
        activeList={{ id: 11, name: "PH4505 - Astrophysics" }}
        taskCount={1}
        pendingTasks={[{ id: 7, title: "Still reading" }]}
        completedTasks={[]}
      />
    );

    expect(await screen.findByText("No suggested readings right now.")).toBeInTheDocument();
    expect(screen.queryByText("All caught up on readings!")).not.toBeInTheDocument();
  });

  it("filters suggestions to the active reading list", async () => {
    getSuggestedReadings.mockResolvedValue([
      { id: 1, title: "Match", module_code: "PH4505" },
      { id: 2, title: "Diff", module_code: "MA202" },
    ]);
    render(<SuggestedReadingsSection activeList={{ id: 7, name: "PH4505 - A" }} taskCount={1} pendingTasks={[]} completedTasks={[]} />);
    expect(await screen.findByText("Match")).toBeInTheDocument();
    expect(screen.queryByText("Diff")).not.toBeInTheDocument();
  });

  it("adds reading as task and removes it from suggestions", async () => {
    const onTaskAdded = vi.fn();
    getSuggestedReadings.mockResolvedValue([{ id: 1, title: "M", module_code: "PH4505" }]);
    render(<SuggestedReadingsSection activeList={{ id: 7, name: "PH4505 - A" }} taskCount={1} pendingTasks={[]} completedTasks={[]} onTaskAdded={onTaskAdded} />);
    fireEvent.click(await screen.findByText("+ Add as task"));
    await waitFor(() => expect(convertReadingToTask).toHaveBeenCalledWith(1));
    expect(onTaskAdded).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("M")).not.toBeInTheDocument());
  });

  it("does not filter suggestions for non-reading lists", async () => {
    getSuggestedReadings.mockResolvedValue([
      { id: 1, title: "R1", module_code: "PH" },
      { id: 2, title: "R2", module_code: "MA" },
    ]);
    render(<SuggestedReadingsSection activeList={{ id: 3, name: "Inbox" }} taskCount={2} pendingTasks={[]} completedTasks={[]} />);
    expect(await screen.findByText("R1")).toBeInTheDocument();
    expect(screen.getByText("R2")).toBeInTheDocument();
  });

  it("uses default task arrays and normalises null suggestions", async () => {
    getSuggestedReadings.mockResolvedValueOnce(null);
    getReadingSpeed.mockResolvedValueOnce({ is_personalised: false, avg_min_per_page: 2 });

    render(
      <SuggestedReadingsSection
        activeList={{ id: 12, name: "Reading List - History" }}
        taskCount={0}
      />,
    );

    expect(await screen.findByText("No suggested readings right now.")).toBeInTheDocument();
    expect(screen.getByText("Average speed estimate")).toBeInTheDocument();
  });
});
