import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import ToolbarFilterPanel from "../../../../pages/Tasks/components/TaskFeedToolbarFilter";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../pages/Tasks/components/TaskFilterPanel", () => ({
  default: () => <div data-testid="task-filter-panel" />,
}));

afterEach(() => {
  vi.useRealTimers();
});

describe("TaskFeedToolbarFilter", () => {
  it("shows the active filter count and toggles open state on click", () => {
    const onFilterOpenChange = vi.fn();

    render(
      <ToolbarFilterPanel
        filterAnchor={{ current: null }}
        isFilterOpen={false}
        onFilterOpenChange={onFilterOpenChange}
        activeFilterCount={3}
        panelProps={{}}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    expect(onFilterOpenChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it("opens on hover and closes after the hover timeout", async () => {
    vi.useFakeTimers();
    const onFilterOpenChange = vi.fn();

    render(
      <ToolbarFilterPanel
        filterAnchor={{ current: null }}
        isFilterOpen={false}
        onFilterOpenChange={onFilterOpenChange}
        activeFilterCount={0}
        panelProps={{}}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: /filter/i }).parentElement);
    expect(onFilterOpenChange).toHaveBeenCalledWith(true);

    onFilterOpenChange.mockClear();
    fireEvent.mouseLeave(screen.getByRole("button", { name: /filter/i }).parentElement);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(onFilterOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders the filter panel when open", () => {
    render(
      <ToolbarFilterPanel
        filterAnchor={{ current: null }}
        isFilterOpen
        onFilterOpenChange={vi.fn()}
        activeFilterCount={1}
        panelProps={{ some: "value" }}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Task filters" })).toBeInTheDocument();
    expect(screen.getByTestId("task-filter-panel")).toBeInTheDocument();
  });

  it("does not reopen the panel on hover when it is already open", () => {
    const onFilterOpenChange = vi.fn();

    render(
      <ToolbarFilterPanel
        filterAnchor={{ current: null }}
        isFilterOpen
        onFilterOpenChange={onFilterOpenChange}
        activeFilterCount={0}
        panelProps={{}}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: /filter/i }).parentElement);
    expect(onFilterOpenChange).not.toHaveBeenCalledWith(true);
  });
});
