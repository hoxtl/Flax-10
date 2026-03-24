import { describe, expect, it, vi } from "vitest";

import { resolveQuickAddModal } from "../../layout/dashboardLayout/dashboardLayoutActions";
import { formatUserYear } from "../../layout/dashboardLayout/dashboardLayoutUser";

describe("dashboard layout helpers", () => {
  it("formats non-numeric years without forcing a Year prefix", () => {
    expect(formatUserYear("Foundation")).toBe("Foundation");
    expect(formatUserYear("Year 4")).toBe("Year 4");
  });

  it("routes add_reading quick-add actions to the reading modal handler", () => {
    const actions = {
      openSociety: vi.fn(),
      openTask: vi.fn(),
      openModuleCreator: vi.fn(),
      openDeadline: vi.fn(),
      openReading: vi.fn(),
      openCalendar: vi.fn(),
    };
    const module = { module_code: "CS102" };

    resolveQuickAddModal("add_reading", module, actions);

    expect(actions.openReading).toHaveBeenCalledWith(module);
    expect(actions.openCalendar).not.toHaveBeenCalled();
  });
});
