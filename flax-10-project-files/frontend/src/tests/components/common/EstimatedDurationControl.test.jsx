import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EstimatedDurationControl from "../../../components/common/EstimatedDurationControl/EstimatedDurationControl.jsx";

describe("EstimatedDurationControl", () => {
  it("renders presets, marks the active preset, and commits custom values", () => {
    const onChangeMinutes = vi.fn();

    const { rerender } = render(
      <EstimatedDurationControl
        valueMinutes={50}
        onChangeMinutes={onChangeMinutes}
        classes={{
          buttonGroup: "preset-group",
          button: "preset-button",
          buttonActive: "preset-active",
          customInput: "custom-shell",
          customInputActive: "custom-active",
          customInputField: "custom-field",
          leading: "custom-leading",
          trailing: "custom-trailing",
        }}
      />,
    );

    expect(screen.getByRole("group", { name: "Estimated duration" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50 minutes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "25 minutes" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "25 minutes" }));
    expect(onChangeMinutes).toHaveBeenCalledWith(25);

    const input = screen.getByRole("spinbutton", { name: "Custom estimated minutes" });
    fireEvent.change(input, { target: { value: "999" } });
    expect(input).toHaveValue(999);
    expect(input.closest(".custom-shell")).toHaveClass("custom-active");

    fireEvent.blur(input);
    expect(onChangeMinutes).toHaveBeenLastCalledWith(240);

    rerender(
      <EstimatedDurationControl
        valueMinutes={240}
        onChangeMinutes={onChangeMinutes}
        classes={{
          buttonGroup: "preset-group",
          button: "preset-button",
          buttonActive: "preset-active",
          customInput: "custom-shell",
          customInputActive: "custom-active",
          customInputField: "custom-field",
          leading: "custom-leading",
          trailing: "custom-trailing",
        }}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Custom estimated minutes" })).toHaveValue(240);
  });

  it("supports custom labels, enter-to-commit, and syncs external values when not editing", () => {
    const onChangeMinutes = vi.fn();
    const { rerender } = render(
      <EstimatedDurationControl
        valueMinutes={15}
        onChangeMinutes={onChangeMinutes}
        ariaLabel="Duration picker"
        customInputAriaLabel="Minutes field"
        presets={[{ value: 15, label: "15m", ariaLabel: "15 minutes" }]}
      />,
    );

    const input = screen.getByRole("spinbutton", { name: "Minutes field" });
    expect(screen.getByRole("group", { name: "Duration picker" })).toBeInTheDocument();
    expect(input).toHaveValue(15);

    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChangeMinutes).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChangeMinutes).toHaveBeenLastCalledWith(15);
    expect(input).toHaveValue(15);

    rerender(
      <EstimatedDurationControl
        valueMinutes={75}
        onChangeMinutes={onChangeMinutes}
        ariaLabel="Duration picker"
        customInputAriaLabel="Minutes field"
        presets={[{ value: 15, label: "15m", ariaLabel: "15 minutes" }]}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Minutes field" })).toHaveValue(75);
  });
});
