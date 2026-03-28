import { describe, it, expect } from "vitest";
import { getModuleCardKey } from "../../../../components/modules/modules/ModuleGrid";

describe("getModuleCardKey", () => {
  it("prefers id, then module_code, then a stable index fallback", () => {
    expect(getModuleCardKey({ id: 42, module_code: "X" }, 0)).toBe("42");
    expect(getModuleCardKey({ id: null, module_code: "ZED" }, 1)).toBe("ZED");
    expect(getModuleCardKey({ module_name: "solo" }, 3)).toBe("module-3");
  });
});
