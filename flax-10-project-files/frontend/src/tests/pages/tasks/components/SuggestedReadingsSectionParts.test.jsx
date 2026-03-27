import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";

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

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, disabled, onClick, pill, variant, size, ...props }) => (
    <button {...props} data-disabled={String(Boolean(disabled))} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../../../../pages/tasks/components/AllTasksCompleteCard", () => ({
  default: ({ message, sub }) => (
    <div>
      <span>{message}</span>
      <span>{sub}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskFeedSections.module.css", () => ({
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

vi.mock("../../../../pages/tasks/components/SuggestedReadingsSection.module.css", () => ({
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
} from "../../../../pages/tasks/components/SuggestedReadingsSectionParts";

describe("SuggestedReadingsSectionParts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertReadingToTask.mockResolvedValue({});
  });

  const mockReading = {
    id: 3,
    title: "Deep Work Notes",
    page_count: 30,
    deadline: "2026-03-24T10:00:00Z",
  };

  it("renders reading information correctly", () => {
    render(<SuggestedReadingCard reading={mockReading} onAdded={vi.fn()} avgMinPerPage={1.5} />);
    expect(screen.getByText("Deep Work Notes")).toBeInTheDocument();
    expect(screen.getByText("30 pages")).toBeInTheDocument();
    expect(screen.getByText(/Due /)).toBeInTheDocument();
    expect(screen.getByText("45 min to read")).toBeInTheDocument();
  });

  it("converts a reading into a task", async () => {
    const onAdded = vi.fn();
    render(<SuggestedReadingCard reading={mockReading} onAdded={onAdded} avgMinPerPage={1.5} />);
    fireEvent.click(screen.getByText("+ Add as task"));
    await waitFor(() => expect(convertReadingToTask).toHaveBeenCalledWith(3));
    expect(onAdded).toHaveBeenCalledWith(3);
    expect(screen.getByText("✓ Added")).toBeInTheDocument();
  });

  it("renders completion state when all readings are done", () => {
    render(
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
  });

  it("renders empty state when there are no readings and only pending tasks", () => {
    render(
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
      screen.getByText(/We’ll show extra reading recommendations/),
    ).toBeInTheDocument();
  });

  it("renders populated body state with readings", () => {
    render(
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

  it("uses fallback reading-speed estimates and ignores repeat add attempts", async () => {
    let resolveAdd;
    convertReadingToTask.mockReturnValueOnce(new Promise((r) => { resolveAdd = r; }));
    render(<SuggestedReadingCard reading={{ id: 11, title: "Fallback estimate", page_count: 20 }} onAdded={vi.fn()} />);

    expect(screen.getByText("40 min to read")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+ Add as task"));
    await waitFor(() => expect(screen.getByText("Adding…")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Adding…"));
    expect(convertReadingToTask).toHaveBeenCalledTimes(1);

    await act(async () => { resolveAdd({}); });

    fireEvent.click(screen.getByText("✓ Added"));
    expect(convertReadingToTask).toHaveBeenCalledTimes(1);
  });
});
