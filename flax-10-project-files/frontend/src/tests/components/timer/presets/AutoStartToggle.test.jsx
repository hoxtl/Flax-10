import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AutoStartToggle } from "../../../../components/timer/presets/AutoStartToggle";
import { AUTOSTART_KEY } from "../../../../components/timer/utils/presetUtils";

describe("AutoStartToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads its initial value from local storage and updates it on toggle", () => {
    localStorage.setItem(AUTOSTART_KEY, "true");

    render(<AutoStartToggle />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(localStorage.getItem(AUTOSTART_KEY)).toBe("false");
  });

  it("swallows storage write errors while still updating local state", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    render(<AutoStartToggle />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
