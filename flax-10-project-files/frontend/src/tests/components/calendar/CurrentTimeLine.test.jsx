import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CurrentTimeLine } from "../../../components/calendar/components/CurrentTimeLine";

describe("CurrentTimeLine", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("positions the line from the current time and updates on the interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T09:30:00.000Z"));

    const { container } = render(<CurrentTimeLine />);
    const line = container.querySelector(".now-line");

    expect(line).toHaveStyle({ top: "570px" });
    expect(container.querySelector(".now-line-dot")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(line).toHaveStyle({ top: "571px" });
  });
});
