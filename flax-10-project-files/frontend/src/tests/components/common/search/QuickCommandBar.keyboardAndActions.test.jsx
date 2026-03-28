import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, itemLabel, onClear }) => (
    <div>
      <div>{`No ${itemLabel} for ${query}`}</div>
      <button onClick={onClear}>Clear</button>
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

import QuickCommandBar from "../../../../components/common/quick_command_bar/QuickCommandBar";
import { buildActionDefs, matchesQuery } from "../../../../components/common/quick_command_bar/commandBarActions";

describe("quick command bar extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds every navigation action including blank module search", () => {
    const onNavChange = vi.fn();
    const actions = buildActionDefs({ onNavChange, onOpenTask: vi.fn() });

    actions.find((action) => action.id === "go-modules").run("");
    actions.find((action) => action.id === "go-calendar").run();
    actions.find((action) => action.id === "go-timer").run();
    actions.find((action) => action.id === "go-tasks").run();
    actions.find((action) => action.id === "go-map").run();
    actions.find((action) => action.id === "go-users").run();
    actions.find((action) => action.id === "go-group-work").run();
    actions.find((action) => action.id === "go-attendance").run();

    expect(onNavChange).toHaveBeenCalledWith("modules");
    expect(onNavChange).toHaveBeenCalledWith("calendar");
    expect(onNavChange).toHaveBeenCalledWith("timer");
    expect(onNavChange).toHaveBeenCalledWith("tasks");
    expect(onNavChange).toHaveBeenCalledWith("map");
    expect(onNavChange).toHaveBeenCalledWith("users");
    expect(onNavChange).toHaveBeenCalledWith("group-work");
    expect(onNavChange).toHaveBeenCalledWith("attendance");
    expect(matchesQuery(actions[0], "OPEN QUICK TASK")).toBe(true);
  });

  it("ignores slash shortcuts in editable and modified-key contexts, then closes on escape", () => {
    render(<QuickCommandBar onNavChange={vi.fn()} onOpenTask={vi.fn()} />);

    fireEvent.keyDown(window, { key: "/", metaKey: true });
    fireEvent.keyDown(window, { key: "/", ctrlKey: true });
    fireEvent.keyDown(window, { key: "/", altKey: true });
    fireEvent.keyDown(window, { key: "/", shiftKey: true });
    const editable = document.createElement("textarea");
    document.body.appendChild(editable);
    fireEvent.keyDown(editable, { key: "/" });
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();
  });

  it("triggers enter and click actions, clears empty-state query, and safely ignores enter without a primary action", () => {
    const onNavChange = vi.fn();
    const onOpenTask = vi.fn();
    render(<QuickCommandBar onNavChange={onNavChange} onOpenTask={onOpenTask} />);

    fireEvent(window, new Event("quick-actions:open"));
    fireEvent.keyDown(screen.getByPlaceholderText("Type to filter actions…"), { key: "Enter", code: "Enter" });
    expect(onOpenTask).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Quick actions")).not.toBeInTheDocument();

    fireEvent(window, new Event("quick-actions:open"));
    fireEvent.click(screen.getByRole("button", { name: /Go to Home/i }));
    expect(onNavChange).toHaveBeenCalledWith("home");

    fireEvent(window, new Event("quick-actions:open"));
    const input = screen.getByPlaceholderText("Type to filter actions…");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No actions for zzz")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByPlaceholderText("Type to filter actions…"), { key: "Enter", code: "Enter" });
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
  });
});
