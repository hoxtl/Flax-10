import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const OVERDUE_DATE = "2026-03-27T12:00:00Z";
const CRITICAL_DATE = "2026-03-29T12:00:00Z";
const URGENT_SOON_DATE = "2026-03-31T12:00:00Z";
const URGENT_LATER_DATE = "2026-04-01T12:00:00Z";
const DISTANT_DATE = "2026-05-01T12:00:00Z";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const rest = { ...props };
          delete rest.animate;
          delete rest.exit;
          delete rest.initial;
          delete rest.layout;
          delete rest.transition;
          delete rest.variants;
          const Element = tag;
          return React.createElement(Element, rest, children);
        },
    },
  ),
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("../../../../components/common/badge/Badge", () => ({
  default: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../../../components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: ({ dueDate, tier }) => <span>{`countdown:${tier}:${dueDate}`}</span>,
}));

vi.mock("../../../../components/common/widget_header/WidgetHeader", () => ({
  default: ({ title, count }) => <div>{`${title} (${count})`}</div>,
}));

vi.mock("../../../../components/modules/shared/widgetParts.jsx", () => ({
  ShowMoreButton: ({ expanded, hiddenCount, onToggle }) => (
    <button onClick={onToggle}>{expanded ? "Show less" : `Show ${hiddenCount} more`}</button>
  ),
}));

vi.mock("../../../../components/common/urgent_glow/UrgentGlow.module.css", () => ({
  default: { urgentGlow: "urgentGlow" },
}));

vi.mock("../../../../pages/modules/styles/DashboardWidgets.module.css", () => ({
  default: {
    widget: "widget",
    widgetEmbedded: "widgetEmbedded",
    widgetHeader: "widgetHeader",
    widgetList: "widgetList",
    emptyState: "emptyState",
    emptyMessage: "emptyMessage",
    emptySub: "emptySub",
    widgetRowMeta: "widgetRowMeta",
  },
}));

vi.mock("../../../../pages/modules/styles/DashboardRows.module.css", () => ({
  default: {
    moduleCodePillBtn: "moduleCodePillBtn",
    moduleCodePill: "moduleCodePill",
    typePill: "typePill",
    deadlineRowLeft: "deadlineRowLeft",
    deadlinePills: "deadlinePills",
    deadlineTitle: "deadlineTitle",
    deadlineRow: "deadlineRow",
    rowOverdue: "rowOverdue",
    rowCritical: "rowCritical",
    expandableRows: "expandableRows",
    expandableRowsInner: "expandableRowsInner",
  },
}));

vi.mock("../../../../components/modules/deadlines/upcomingDeadlinesUtils", () => ({
  DEADLINE_TIER_ORDER: {
    overdue: 0,
    critical: 1,
    urgent: 2,
    upcoming: 3,
    distant: 4,
  },
  TIER_ACCENT: {
    overdue: "red",
    critical: "orange",
    urgent: "yellow",
    upcoming: "blue",
    distant: "gray",
  },
  getUrgencyTier: vi.fn((dueDate) => {
    switch (dueDate) {
      case OVERDUE_DATE:
        return "overdue";
      case CRITICAL_DATE:
        return "critical";
      case URGENT_SOON_DATE:
      case URGENT_LATER_DATE:
        return "urgent";
      case DISTANT_DATE:
        return "distant";
      default:
        return "upcoming";
    }
  }),
}));

import { UpcomingDeadlinesWidget } from "../../../../components/modules/deadlines/UpcomingDeadlinesWidget";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UpcomingDeadlinesWidget coverage top-up", () => {
  it("renders with the component defaults when no props are provided", () => {
    render(<UpcomingDeadlinesWidget />);

    expect(screen.getByText("Upcoming Deadlines (0)")).toBeInTheDocument();
    expect(screen.getByText("No upcoming deadlines")).toBeInTheDocument();
    expect(screen.getByText("You're all caught up — enjoy the calm.")).toBeInTheDocument();
  });

  it("renders the built-in empty state and embedded shell styling", () => {
    const { container } = render(
      <UpcomingDeadlinesWidget
        deadlines={[]}
        embedded
        emptyMessage="Nothing due right now"
        emptySub="Take a breather."
      />,
    );

    expect(screen.getByText("Upcoming Deadlines (0)")).toBeInTheDocument();
    expect(screen.getByText("Nothing due right now")).toBeInTheDocument();
    expect(screen.getByText("Take a breather.")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("widgetEmbedded");
  });

  it("sorts same-tier deadlines by date and falls back to assessment and assignment labels", () => {
    const { container } = render(
      <UpcomingDeadlinesWidget
        deadlines={[
          { id: 2, title: "Later urgent", start_due_date: URGENT_LATER_DATE, deadline_type: "quiz" },
          { id: 1, start_due_date: URGENT_SOON_DATE, deadline_type: null },
        ]}
        initialShown={2}
      />,
    );

    const rows = Array.from(container.querySelectorAll(".deadlineRow")).map((row) => row.textContent);
    expect(rows[0]).toContain("Assignment");
    expect(rows[0]).toContain("ASSESSMENT");
    expect(rows[1]).toContain("Later urgent");
  });

  it("expands extra rows and keeps tier ordering across overdue, critical, urgent, and distant deadlines", () => {
    const { container } = render(
      <UpcomingDeadlinesWidget
        deadlines={[
          { id: 4, title: "Later urgent", module_code: "BIO2", start_due_date: URGENT_LATER_DATE, deadline_type: "quiz" },
          { id: 2, assessment_title: "Critical exam", module_code: "ENG1", start_due_date: CRITICAL_DATE, deadline_type: "exam" },
          { id: 5, start_due_date: DISTANT_DATE, deadline_type: null },
          { id: 3, title: "Soon urgent", start_due_date: URGENT_SOON_DATE, deadline_type: null },
          { id: 1, title: "Already overdue", module_code: "LAW1", start_due_date: OVERDUE_DATE, deadline_type: "coursework" },
        ]}
        initialShown={2}
      />,
    );

    expect(screen.getByText("Show 3 more")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Show 3 more"));

    const rows = Array.from(container.querySelectorAll(".deadlineRow")).map((row) => row.textContent);
    expect(rows[0]).toContain("Already overdue");
    expect(rows[1]).toContain("Critical exam");
    expect(rows[2]).toContain("Soon urgent");
    expect(rows[3]).toContain("Later urgent");
    expect(rows[4]).toContain("Assignment");

    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("Soon urgent")).not.toBeInTheDocument();
  });

  it("handles interactive rows, keyboard selection, and module pill clicks without selecting the row", () => {
    const onSelectDeadline = vi.fn();
    const onModuleCodeClick = vi.fn();

    render(
      <UpcomingDeadlinesWidget
        deadlines={[
          { id: 7, title: "Essay", module_code: "CS101", start_due_date: CRITICAL_DATE, deadline_type: "exam" },
        ]}
        interactiveRows
        onSelectDeadline={onSelectDeadline}
        onModuleCodeClick={onModuleCodeClick}
      />,
    );

    const row = screen.getByRole("button", { name: /essay/i });

    fireEvent.keyDown(row, { key: "Escape" });
    expect(onSelectDeadline).not.toHaveBeenCalled();

    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.click(row);
    expect(onSelectDeadline).toHaveBeenCalledTimes(2);

    fireEvent.mouseDown(screen.getByText("EXAM"));
    fireEvent.click(screen.getByText("EXAM"));
    fireEvent.click(screen.getByText("CS101"));

    expect(onModuleCodeClick).toHaveBeenCalledWith("CS101");
    expect(onSelectDeadline).toHaveBeenCalledTimes(2);
  });

  it("falls back to an empty internal list when array detection treats null like an array", () => {
    const originalIsArray = Array.isArray;
    const isArraySpy = vi.spyOn(Array, "isArray").mockImplementation((value) => {
      if (value === null) return true;
      return originalIsArray(value);
    });

    render(<UpcomingDeadlinesWidget deadlines={null} renderEmpty={() => <div>Patched empty</div>} />);

    expect(screen.getByText("Patched empty")).toBeInTheDocument();
    isArraySpy.mockRestore();
  });
});
