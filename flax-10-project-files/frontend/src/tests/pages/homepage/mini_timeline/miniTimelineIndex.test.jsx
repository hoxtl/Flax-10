import { describe, expect, it } from "vitest";

import { MiniTimeline } from "../../../../pages/homepage/components/mini_timeline";

describe("mini timeline index", () => {
  it("re-exports the MiniTimeline component", () => {
    expect(MiniTimeline).toBeTypeOf("function");
  });
});
