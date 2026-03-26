import { afterEach, describe, expect, it, vi } from "vitest";

describe("pillUtils extra coverage", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../../components/Calendar/utils/eventUtils");
  });

  it("supports the default empty items parameter", async () => {
    const { countByType } = await import("../../components/Tags/utils/pillUtils");
    expect(countByType()).toEqual({ all: 0 });
  });

  it("skips falsy effective tag names", async () => {
    vi.doMock("../../components/Calendar/utils/eventUtils", () => ({
      getEffectiveTagName: vi.fn(() => ""),
    }));

    const { countByType } = await import("../../components/Tags/utils/pillUtils");
    expect(countByType([{ id: 1 }])).toEqual({ all: 1 });
  });
});
