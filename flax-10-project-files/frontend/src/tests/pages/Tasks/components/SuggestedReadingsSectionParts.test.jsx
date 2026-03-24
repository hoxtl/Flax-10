import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: () => ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  ),
}));

vi.mock("../../../../api/readingApi", () => ({
  convertReadingToTask: vi.fn(),
}));

vi.mock("../../../../components/common/EmptyState/EmptyState", () => ({
  default: ({ title, description }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../pages/Tasks/components/AllTasksCompleteCard", () => ({
  default: ({ message, sub }) => (
    <div>
      <span>{message}</span>
      <span>{sub}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/components/TaskFeedSections.module.css", () => ({
  default: {
    sectionStatsChip: "sectionStatsChip",
    sectionCountWrap: "sectionCountWrap",
    sectionCountPill: "sectionCountPill",
    sectionChevronBtn: "sectionChevronBtn",
    sectionChevron: "sectionChevron",
    sectionHeader: "sectionHeader",
    sectionIcon: "sectionIcon",
    sectionTitle: "sectionTitle",
  },
}));

vi.mock("../../../../pages/Tasks/components/SuggestedReadingsSection.module.css", () => ({
  default: {
    row: "row",
    rowAdded: "rowAdded",
    rowLeft: "rowLeft",
    rowTitle: "rowTitle",
    rowInfos: "rowInfos",
    rowInfo: "rowInfo",
    rowHint: "rowHint",
    rows: "rows",
    neutralEmptyState: "neutralEmptyState",
    headerMeta: "headerMeta",
  },
}));

import { convertReadingToTask } from "../../../../api/readingApi";
import {
  SuggestedReadingCard,
  SuggestedReadingsHeader,
  SuggestedReadingsBody,
  SuggestedReadingsCollapse,
} from "../../../../pages/Tasks/components/SuggestedReadingsSectionParts";

describe("SuggestedReadingsSectionParts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertReadingToTask.mockResolvedValue({});
  });

  it("renders reading info and converts a reading into a task", async () => {
    const onAdded = vi.fn();

    render(
      <SuggestedReadingCard
        reading={{
          id: 3,
          title: "Deep Work Notes",
          page_count: 30,
          deadline: "2026-03-24T10:00:00Z",
        }}
        onAdded={onAdded}
        avgMinPerPage={1.5}
      />,
    );

    expect(screen.getByText("Deep Work Notes")).toBeInTheDocument();
    expect(screen.getByText("30 pages")).toBeInTheDocument();
    expect(screen.getByText(/Due /)).toBeInTheDocument();
    expect(screen.getByText("45 min to read")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+ Add as task"));

    await waitFor(() => expect(convertReadingToTask).toHaveBeenCalledWith(3));
    expect(onAdded).toHaveBeenCalledWith(3);
    expect(screen.getByText("✓ Added")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✓ Added"));
    expect(convertReadingToTask).toHaveBeenCalledTimes(1);
  });

  it("renders personalized and fallback header meta", () => {
    const { rerender } = render(
      <SuggestedReadingsHeader
        count={4}
        collapsed={false}
        onToggle={vi.fn()}
        speedData={{ is_personalised: true, avg_min_per_page: 1.64 }}
      />,
    );

    expect(screen.getByText("⚡ 1.6 min/page")).toBeInTheDocument();
    expect(screen.getByLabelText("4 suggested readings")).toBeInTheDocument();

    rerender(
      <SuggestedReadingsHeader
        count={1}
        collapsed
        onToggle={vi.fn()}
        speedData={{ is_personalised: false, avg_min_per_page: 2 }}
      />,
    );

    expect(screen.getByText("Average speed estimate")).toBeInTheDocument();
  });

  it("renders completion, empty, and populated body states", () => {
    const { rerender } = render(
      <SuggestedReadingsBody
        activeListLabel="History reading list"
        readings={[]}
        pendingTasks={[]}
        completedTasks={[{ id: 1 }]}
        onAdded={vi.fn()}
      />,
    );

    expect(screen.getByText("All caught up on readings!")).toBeInTheDocument();
    expect(screen.getByText("No suggested readings left for History reading list right now.")).toBeInTheDocument();

    rerender(
      <SuggestedReadingsBody
        activeListLabel="History reading list"
        readings={[]}
        pendingTasks={[{ id: 2 }]}
        completedTasks={[]}
        onAdded={vi.fn()}
      />,
    );

    expect(screen.getByText("No suggested readings right now.")).toBeInTheDocument();
    expect(
      screen.getByText("We’ll show extra reading recommendations for History reading list here when they’re available."),
    ).toBeInTheDocument();

    rerender(
      <SuggestedReadingsBody
        activeListLabel="History reading list"
        readings={[{ id: 7, title: "Seminar prep" }]}
        pendingTasks={[{ id: 2 }]}
        completedTasks={[]}
        onAdded={vi.fn()}
      />,
    );

    expect(screen.getByText("Seminar prep")).toBeInTheDocument();
  });

  it("hides collapsed content and shows expanded content", () => {
    const { rerender } = render(
      <SuggestedReadingsCollapse collapsed>
        <div>Collapsed body</div>
      </SuggestedReadingsCollapse>,
    );

    expect(screen.queryByText("Collapsed body")).not.toBeInTheDocument();

    rerender(
      <SuggestedReadingsCollapse collapsed={false}>
        <div>Expanded body</div>
      </SuggestedReadingsCollapse>,
    );

    expect(screen.getByText("Expanded body")).toBeInTheDocument();
  });
});
