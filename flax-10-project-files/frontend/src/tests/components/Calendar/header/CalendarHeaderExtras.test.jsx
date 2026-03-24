import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MobileDateStrip } from "../../../../components/Calendar/header/MobileDateStrip";
import { SearchButton } from "../../../../components/Calendar/header/SearchButton";
import { ViewModeButton } from "../../../../components/Calendar/header/ViewModeButton";
import { ScheduleManagerButton } from "../../../../components/Calendar/header/ScheduleManager/ScheduleManagerButton";

vi.mock("../../../../components/Calendar/utils/dateUtils", () => ({
  getStartOfWeek: vi.fn(() => new Date("2026-03-23T00:00:00.000Z")),
  addDays: vi.fn((date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }),
  isSameDay: vi.fn((left, right) => left.toDateString() === right.toDateString()),
}));

vi.mock("lucide-react", () => ({
  Search: () => <span>search-icon</span>,
  X: () => <span>x-icon</span>,
  LayoutList: () => <span>layout-icon</span>,
  FolderKanban: () => <span>folder-icon</span>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../components/common/SearchBar/SearchBar", () => ({
  default: ({ value, onChange, onBlur, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  ),
}));

vi.mock("../../../../components/common/AnimatedDropdown", () => ({
  default: ({ customTrigger, options = [], onChange, value, openOnHover }) => (
    <div data-testid="dropdown" data-open-on-hover={String(openOnHover)} data-value={value}>
      {customTrigger}
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/Calendar/header/ScheduleManager/ScheduleManagerDialog", () => ({
  ScheduleManagerDialog: ({ open, onClose }) => (
    <div>
      <span>{open ? "dialog-open" : "dialog-closed"}</span>
      <button type="button" onClick={onClose}>close-dialog</button>
    </div>
  ),
}));

describe("Calendar header extras", () => {
  it("renders the mobile date strip and dispatches both actions when a day is selected", () => {
    const dispatch = vi.fn();
    render(<MobileDateStrip selectedDate={new Date("2026-03-24T00:00:00.000Z")} dispatch={dispatch} />);

    const buttons = Array.from(document.querySelectorAll("button"));
    expect(buttons).toHaveLength(7);
    fireEvent.click(buttons[2]);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "SET_SELECTED_DATE" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "SET_VIEW_MODE", payload: "day" });
  });

  it("expands, updates, blurs, and closes the search button", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchButton value="" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Search events"));
    const input = screen.getByLabelText("Search events...");
    fireEvent.change(input, { target: { value: "lab" } });
    expect(onChange).toHaveBeenCalledWith("lab");

    fireEvent.blur(input);
    expect(screen.queryByLabelText("Search events...")).not.toBeInTheDocument();

    rerender(<SearchButton value="lab" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Search events"));
    fireEvent.click(screen.getByLabelText("Close search"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("renders the view mode dropdown and respects mobile hover behavior", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ViewModeButton
        modes={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }]}
        activeMode="month"
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId("dropdown")).toHaveAttribute("data-open-on-hover", "true");
    fireEvent.click(screen.getByText("Week"));
    expect(onChange).toHaveBeenCalledWith("week");

    rerender(
      <ViewModeButton
        modes={[{ value: "month", label: "Month" }]}
        activeMode="month"
        onChange={onChange}
        isMobile
      />,
    );
    expect(screen.getByTestId("dropdown")).toHaveAttribute("data-open-on-hover", "false");
  });

  it("opens and closes the schedule manager dialog", () => {
    render(<ScheduleManagerButton />);
    expect(screen.getByText("dialog-closed")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Manage schedules"));
    expect(screen.getByText("dialog-open")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close-dialog"));
    expect(screen.getByText("dialog-closed")).toBeInTheDocument();
  });
});
