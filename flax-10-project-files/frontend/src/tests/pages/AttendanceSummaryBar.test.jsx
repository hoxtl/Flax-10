import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import AttendanceSummaryBar from "../../pages/attendance/components/AttendanceSummaryBar";

const useCountUpMock = vi.fn();

vi.mock("../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUpMock(...args),
}));

describe("AttendanceSummaryBar", () => {
  beforeEach(() => {
    useCountUpMock.mockReset();
    useCountUpMock.mockReturnValue({ current: null });
  });

  it("animates each attendance stat with the shared count-up hook", () => {
    render(
      <AttendanceSummaryBar
        summary={{ pct: 96, attended: 163, missed: 6, unmarkedCount: 11 }}
      />
    );

    expect(useCountUpMock).toHaveBeenNthCalledWith(1, 96, 1200);
    expect(useCountUpMock).toHaveBeenNthCalledWith(2, 163, 1200);
    expect(useCountUpMock).toHaveBeenNthCalledWith(3, 6, 1200);
    expect(useCountUpMock).toHaveBeenNthCalledWith(4, 11, 1200);
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "0%")).toBeInTheDocument();
  });

  it("renders nothing when the attendance percentage is unavailable", () => {
    const { container } = render(
      <AttendanceSummaryBar
        summary={{ pct: null, attended: 0, missed: 0, unmarkedCount: 0 }}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(useCountUpMock).not.toHaveBeenCalled();
  });
});
