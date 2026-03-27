/**
 * Covers ReadingsPanel empty, modal, and urgency branches.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const { animate: _animate, exit: _exit, initial: _initial, transition: _transition, variants: _variants, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

vi.mock("lucide-react", () => ({
  BookOpen: () => <span>book-open</span>,
}));

vi.mock("../../../components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: ({ dueDate, tier }) => <div data-testid={`countdown-${tier}`}>{dueDate}</div>,
}));

vi.mock("../../../components/common/urgent_glow/UrgentGlow.module.css", () => ({
  default: {
    urgentGlow: "urgent-glow",
  },
}));

vi.mock("../../../components/modules/deadlines/upcomingDeadlinesUtils", () => ({
  TIER_ACCENT: {
    overdue: "#f00",
    critical: "#c00",
    distant: "#999",
  },
  getUrgencyTier: (value) => {
    if (String(value).includes("overdue")) return "overdue";
    if (String(value).includes("critical")) return "critical";
    return "distant";
  },
}));

vi.mock("../../../components/modules/shared/taskButtons.jsx", () => ({
  AddReadingToTasksButton: ({ readingId, onAdded }) => (
    <button onClick={() => onAdded(readingId)}>add reading</button>
  ),
}));

vi.mock("../../../components/modules/shared/widgetVariants.js", () => ({
  containerVariants: {},
  expandBodyVariants: {},
  itemVariants: {},
  listVariants: {},
}));

vi.mock("../../../components/modules/shared/widgetParts.jsx", () => ({
  WidgetHeader: ({ title, count }) => (
    <div>
      <span>{title}</span>
      <span>{count}</span>
    </div>
  ),
  ShowMoreButton: ({ expanded, hiddenCount, onToggle }) => (
    <button onClick={onToggle}>{expanded ? "Show less" : `Show more (${hiddenCount})`}</button>
  ),
}));

vi.mock("../../../pages/tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: ({ task, onClose }) => (
    <div data-testid="task-info-modal">
      <div>{task.title}</div>
      <div data-testid="task-module-code">{String(task.module_code)}</div>
      <div data-testid="task-page-count">{String(task.page_count)}</div>
      <button onClick={onClose}>close-modal</button>
    </div>
  ),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/modules/ReadingsPanel.test.jsx
import ReadingsPanel from "../../../pages/modules/components/ReadingsPanel.jsx";
=======
import ReadingsPanel from "../../../pages/modules/ReadingsPanel.jsx";
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Modules/ReadingsPanel.test.jsx

const readings = [
  {
    id: 3,
    title: "Seminar Notes",
    module_code: "PH101",
    module_name: "",
    due_date: "2026-04-05T09:00:00Z",
  },
  {
    id: 1,
    title: "Foundations: Chapter 2",
    module_code: "CS101",
    module_name: "Foundations",
    deadline: "2026-03-28T09:00:00Z",
    start_page: 1,
    end_page: 20,
  },
  {
    id: 2,
    title: "Essay Draft",
    module_code: "CS101",
    module_name: "",
    deadline: "2026-03-30T09:00:00Z",
    page_count: 8,
  },
  {
    id: 4,
    title: "Workshop Prep",
    module_code: "CS101",
    module_name: "",
    deadline: "2026-04-01T09:00:00Z",
  },
  {
    id: 5,
    title: "Optional Reading",
    module_code: "CS101",
    module_name: "",
    deadline: "2026-04-06T09:00:00Z",
  },
];

const edgeReadings = [
  { id: 9, title: null, module_name: "Philosophy" },
  { id: 10, title: "History: Intro", module_name: "History" },
  { id: 11, title: "No due date" },
];

describe("ReadingsPanel coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty state when no readings are assigned", () => {
    render(<ReadingsPanel readings={[]} onReadingAdded={vi.fn()} />);

    expect(screen.getByText("No readings assigned")).toBeInTheDocument();
    expect(screen.getByText("Your reading list will appear here when tutors add materials.")).toBeInTheDocument();
  });

  it("handles undefined readings and falls back for missing metadata", async () => {
    const { rerender } = render(<ReadingsPanel readings={undefined} onReadingAdded={vi.fn()} />);
    expect(screen.getByText("No readings assigned")).toBeInTheDocument();
  });

  it("falls back for missing metadata", async () => {
    const edgeReadings = [
      { id: 9, title: null, module_name: "Philosophy" },
      { id: 10, title: "History: Intro", module_name: "History" },
      { id: 11, title: "No due date" },
    ];
    render(<ReadingsPanel readings={edgeReadings} onReadingAdded={vi.fn()} />);
    expect(screen.getAllByTestId("countdown-distant")).toHaveLength(3);
    fireEvent.click(screen.getByText("Intro"));
    expect(await screen.findByTestId("task-info-modal")).toBeInTheDocument();
    expect(screen.getByTestId("task-module-code")).toHaveTextContent("null");
    expect(screen.getByTestId("task-page-count")).toHaveTextContent("null");
  });

  it("sorts, expands, and opens the modal with computed page counts", async () => {
    const onReadingAdded = vi.fn();
    render(<ReadingsPanel readings={readings} onReadingAdded={onReadingAdded} />);
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
    expect(screen.queryByText("Optional Reading")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more (1)" }));
    expect(screen.getByText("Optional Reading")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Chapter 2"));
    expect(await screen.findByTestId("task-info-modal")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
    expect(screen.getByTestId("task-page-count")).toHaveTextContent("20");
    fireEvent.click(screen.getByRole("button", { name: "close-modal" }));
    await waitFor(() => expect(screen.queryByTestId("task-info-modal")).not.toBeInTheDocument());
    fireEvent.click(screen.getByText("Seminar Notes"));
    expect(await screen.findByTestId("task-info-modal")).toBeInTheDocument();
    expect(screen.getByTestId("task-page-count")).toHaveTextContent("null");
    fireEvent.click(screen.getAllByRole("button", { name: "add reading" })[3]);
    expect(onReadingAdded).toHaveBeenCalledWith(3);
  });

  it("applies overdue, critical, and urgent highlight classes", () => {
    const highlightedReadings = [
      {
        id: 21,
        title: "Urgent reading",
        deadline: "overdue-2026-03-20",
      },
      {
        id: 22,
        title: "Critical reading",
        deadline: "critical-2026-03-21",
      },
    ];

    render(<ReadingsPanel readings={highlightedReadings} onReadingAdded={vi.fn()} />);

    const urgentRow = screen.getByText("Urgent reading").closest("div[style*='--deadline-row-accent']");
    const criticalRow = screen.getByText("Critical reading").closest("div[style*='--deadline-row-accent']");
    expect(urgentRow.className).toContain("urgent-glow");
    expect(criticalRow.className).toContain("rowCritical");
  });
});
