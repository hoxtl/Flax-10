import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import QuickCommandBar from "../../../components/common/quick_command_bar/QuickCommandBar";
import { buildActionDefs, matchesQuery } from "../../../components/common/quick_command_bar/commandBarActions";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.whileTap;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, onClear }) => (
    <div>
      <span>No actions for {query}</span>
      <button onClick={onClear}>Clear query</button>
    </div>
  ),
}));

vi.mock("lucide-react", async () => {
  const icon = () => <svg aria-hidden="true" />;
  return {
    CalendarPlus2: icon,
    GraduationCap: icon,
    Timer: icon,
    Users: icon,
    Sparkles: icon,
    Home: icon,
    Calendar: icon,
    CheckSquare: icon,
    MapPin: icon,
    BarChart2: icon,
    ClipboardCheck: icon,
    UserCheck: icon,
  };
});

describe("commandBarActions", () => {
  it("builds actions and runs navigation handlers", () => {
    const onNavChange = vi.fn();
    const onOpenTask = vi.fn();
    const actions = buildActionDefs({ onNavChange, onOpenTask });

    actions.find((action) => action.id === "add-task").run();
    actions.find((action) => action.id === "go-home").run();
    actions.find((action) => action.id === "go-modules").run(" CS101 ");
    actions.find((action) => action.id === "go-societies").run();

    expect(onOpenTask).toHaveBeenCalledOnce();
    expect(onNavChange).toHaveBeenCalledWith("home");
    expect(onNavChange).toHaveBeenCalledWith("/modules?code=CS101");
    expect(onNavChange).toHaveBeenCalledWith("/societies?tab=all");
    expect(matchesQuery(actions[0], "")).toBe(true);
    expect(matchesQuery(actions[0], "quick task")).toBe(true);
    expect(matchesQuery(actions[0], "missing")).toBe(false);
  });
});

describe("QuickCommandBar", () => {
  it("opens the bar from the slash shortcut or custom event", () => {
    render(<QuickCommandBar onNavChange={vi.fn()} onOpenTask={vi.fn()} />);
    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Esc" }));
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();
    fireEvent(window, new Event("quick-actions:open"));
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
  });

  it("filters and executes a navigation action", () => {
    const onNavChange = vi.fn();
    render(<QuickCommandBar onNavChange={onNavChange} onOpenTask={vi.fn()} />);
    fireEvent(window, new Event("quick-actions:open"));
    fireEvent.change(screen.getByPlaceholderText(/filter/), { target: { value: "analytics" } });
    fireEvent.click(screen.getByRole("button", { name: /analytics/i }));
    expect(onNavChange).toHaveBeenCalledWith("analytics");
  });

  it("closes the bar when clicking the backdrop", () => {
    render(<QuickCommandBar onNavChange={vi.fn()} onOpenTask={vi.fn()} />);
    fireEvent(window, new Event("quick-actions:open"));
    const backdrop = screen.getByText("Quick actions").closest("div").parentElement.parentElement;
    fireEvent.mouseDown(backdrop);
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();
  });

  it("shows the empty state and clears the query", () => {
    render(<QuickCommandBar onNavChange={vi.fn()} onOpenTask={vi.fn()} />);

    fireEvent(window, new Event("quick-actions:open"));
    const input = screen.getByPlaceholderText("Type to filter actions…");
    fireEvent.change(input, { target: { value: "zzz" } });

    expect(screen.getByText("No actions for zzz")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear query"));
    expect(input).toHaveValue("");
  });
});
