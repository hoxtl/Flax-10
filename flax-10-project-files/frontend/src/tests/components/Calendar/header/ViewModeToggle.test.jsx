import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ViewSwitcher } from "../../../../components/calendar/header/calendarHeaderUtils";

<<<<<<< HEAD
vi.mock(
  "../../../../components/common/segmented_control/SegmentedControl",
  () => ({
    SegmentedControl: function MockSegmentedControl({
      value,
      onChange,
      options,
    }) {
      return (
        <div data-testid="view-mode-toggle">
          <span data-value={value}>{value}</span>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
=======
vi.mock('../../../../components/common/AnimatedDropdown', () => ({
    default: function MockAnimatedDropdown({ value, onChange, options, placeholder }) {
        return (
            <div data-testid="view-mode-toggle">
                <span>{placeholder}</span>
                <span data-value={value}>{value}</span>
                {options.map(opt => (
                    <button key={opt.value} type="button" onClick={() => onChange(opt.value)}>
                        {opt.label}
                    </button>
                ))}
            </div>
        );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    },
  }),
);

describe("ViewSwitcher", () => {
  it("renders with active mode and calls onChange", () => {
    const onChange = vi.fn();
    const modes = [
      { label: "Day", value: "day" },
      { label: "Week", value: "week" },
      { label: "Month", value: "month" },
    ];
    render(
      <ViewSwitcher modes={modes} activeMode="week" onChange={onChange} />,
    );
    expect(screen.getByTestId("view-mode-toggle")).toBeInTheDocument();
    expect(screen.getByText("week")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Day"));
    expect(onChange).toHaveBeenCalledWith("day");

<<<<<<< HEAD
    fireEvent.click(screen.getByText("Month"));
    expect(onChange).toHaveBeenCalledWith("month");
  });
=======
        fireEvent.click(screen.getByText('Month'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'month' });
    });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
});
