import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EstimatedDurationControl from "../../../../components/common/estimated_duration_control/EstimatedDurationControl.jsx";

describe("EstimatedDurationControl", () => {
  it("renders presets and identifies the active one", () => {
    render(<EstimatedDurationControl valueMinutes={50} onChangeMinutes={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Estimated duration" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50 minutes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "25 minutes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the value when a preset is clicked", () => {
    const onChangeMinutes = vi.fn();
    render(<EstimatedDurationControl valueMinutes={50} onChangeMinutes={onChangeMinutes} />);
    fireEvent.click(screen.getByRole("button", { name: "25 minutes" }));
    expect(onChangeMinutes).toHaveBeenCalledWith(25);
  });

  it("handles custom value entry and blur commitment", () => {
    const onChangeMinutes = vi.fn();
    render(<EstimatedDurationControl valueMinutes={50} onChangeMinutes={onChangeMinutes} />);
    const input = screen.getByRole("spinbutton", { name: "Custom estimated minutes" });
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.blur(input);
    expect(onChangeMinutes).toHaveBeenCalledWith(100);
  });

  it("supports custom labels and aria-labels", () => {
    render(
      <EstimatedDurationControl
        valueMinutes={15}
        onChangeMinutes={vi.fn()}
        ariaLabel="Duration picker"
        customInputAriaLabel="Minutes field"
      />,
    );
    expect(screen.getByRole("group", { name: "Duration picker" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Minutes field" })).toBeInTheDocument();
  });

  it("handles enter key to commit custom value", () => {
    const onChangeMinutes = vi.fn();
    render(<EstimatedDurationControl valueMinutes={15} onChangeMinutes={onChangeMinutes} />);
    const input = screen.getByRole("spinbutton", { name: "Custom estimated minutes" });
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChangeMinutes).toHaveBeenCalledWith(30);
  });

  it("syncs with external value updates when not editing", () => {
    const { rerender } = render(<EstimatedDurationControl valueMinutes={15} onChangeMinutes={vi.fn()} />);
    rerender(<EstimatedDurationControl valueMinutes={75} onChangeMinutes={vi.fn()} />);
    expect(screen.getByRole("spinbutton", { name: "Custom estimated minutes" })).toHaveValue(75);
  });

  it("falls back to the default pomodoro value and supports grouped custom classes", () => {
    render(
      <EstimatedDurationControl
        onChangeMinutes={vi.fn()}
        classes={{
          root: "root-class",
          buttonGroup: "button-group",
          button: "button-base",
          buttonActive: "button-active",
        }}
      />,
    );

    expect(screen.getByRole("group", { name: "Estimated duration" })).toHaveClass("root-class");
    expect(screen.getByRole("spinbutton", { name: "Custom estimated minutes" })).toHaveValue(25);
    expect(document.querySelector(".button-group")).toBeTruthy();
    expect(screen.getByRole("button", { name: "25 minutes" })).toHaveClass("button-base", "button-active");
  });

  it("keeps the edited value while typing and ignores non-enter keyboard presses", () => {
    const onChangeMinutes = vi.fn();
    const { rerender } = render(
      <EstimatedDurationControl
        valueMinutes={25}
        onChangeMinutes={onChangeMinutes}
        presets={[{ value: 25, label: "25m", ariaLabel: "25 minutes" }]}
        classes={{ customInput: "custom-input", customInputActive: "custom-input-active" }}
      />,
    );

    const input = screen.getByRole("spinbutton", { name: "Custom estimated minutes" });
    fireEvent.change(input, { target: { value: "35" } });
    expect(input.parentElement).toHaveClass("custom-input", "custom-input-active");

    rerender(
      <EstimatedDurationControl
        valueMinutes={50}
        onChangeMinutes={onChangeMinutes}
        presets={[{ value: 25, label: "25m", ariaLabel: "25 minutes" }]}
        classes={{ customInput: "custom-input", customInputActive: "custom-input-active" }}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Custom estimated minutes" })).toHaveValue(35);
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Custom estimated minutes" }), { key: "Escape" });
    expect(onChangeMinutes).not.toHaveBeenCalled();
  });
});
