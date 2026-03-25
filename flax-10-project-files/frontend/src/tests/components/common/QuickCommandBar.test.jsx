import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import QuickCommandBar from "../../../components/common/QuickCommandBar/QuickCommandBar";
import { buildActionDefs, matchesQuery } from "../../../components/common/QuickCommandBar/commandBarActions";

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

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
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
  it("opens from the slash shortcut, filters actions, triggers the primary action, and closes", () => {
    const onNavChange = vi.fn();
    const onOpenTask = vi.fn();

    render(<QuickCommandBar onNavChange={onNavChange} onOpenTask={onOpenTask} />);

    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByText("Quick actions")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Type to filter actions…");
    fireEvent.change(input, { target: { value: "analytics" } });
    fireEvent.keyDown(screen.getByPlaceholderText("Type to filter actions…"), { key: "ArrowDown", code: "ArrowDown" });
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /View analytics/i }));
    expect(onNavChange).toHaveBeenCalledWith("analytics");

    fireEvent.keyDown(window, { key: "/" });
    fireEvent.mouseDown(screen.getByText("Quick actions").closest("div"));
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("Quick actions").closest("div").parentElement.parentElement);
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();

    fireEvent(window, new Event("quick-actions:open"));
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Esc" }));
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();

    const inputTarget = document.createElement("input");
    document.body.appendChild(inputTarget);
    fireEvent.keyDown(inputTarget, { key: "/" });
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
