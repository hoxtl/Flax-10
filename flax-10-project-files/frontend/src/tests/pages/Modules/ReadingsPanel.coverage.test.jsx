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

vi.mock("../../../components/common/DeadlineCountdown/DeadlineCountdown", () => ({
  default: ({ dueDate, tier }) => <div data-testid={`countdown-${tier}`}>{dueDate}</div>,
}));

vi.mock("../../../components/common/UrgentGlow/UrgentGlow.module.css", () => ({
  default: {
    urgentGlow: "urgent-glow",
  },
}));

vi.mock("../../../components/Modules/Deadlines/upcomingDeadlinesUtils", () => ({
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

vi.mock("../../../components/Modules/shared/taskButtons.jsx", () => ({
  AddReadingToTasksButton: ({ readingId, onAdded }) => (
    <button onClick={() => onAdded(readingId)}>add reading</button>
  ),
}));

vi.mock("../../../components/Modules/shared/widgetVariants.js", () => ({
  containerVariants: {},
  expandBodyVariants: {},
  itemVariants: {},
  listVariants: {},
}));

vi.mock("../../../components/Modules/shared/widgetParts.jsx", () => ({
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

vi.mock("../../../pages/Tasks/components/TaskInfoModal", () => ({
  TaskInfoModal: ({ task, onClose }) => (
    <div data-testid="task-info-modal">
      <div>{task.title}</div>
      <div data-testid="task-page-count">{String(task.page_count)}</div>
      <button onClick={onClose}>close-modal</button>
    </div>
  ),
}));

import ReadingsPanel from "../../../pages/Modules/ReadingsPanel.jsx";

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

describe("ReadingsPanel coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty state when no readings are assigned", () => {
    render(<ReadingsPanel readings={[]} onReadingAdded={vi.fn()} />);

    expect(screen.getByText("No readings assigned")).toBeInTheDocument();
    expect(screen.getByText("Your reading list will appear here when tutors add materials.")).toBeInTheDocument();
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
});
