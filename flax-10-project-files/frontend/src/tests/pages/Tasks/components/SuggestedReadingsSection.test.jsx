import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import SuggestedReadingsSection from "../../../../pages/Tasks/components/SuggestedReadingsSection";
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

    expect(await screen.findByText("Suggested Reading List")).toBeInTheDocument();
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
});
