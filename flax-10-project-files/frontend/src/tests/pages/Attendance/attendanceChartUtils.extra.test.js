import { describe, expect, it, vi } from "vitest";

import {
  buildDonutSeries,
  buildPieClickHandler,
  buildValueFormatter,
} from "../../../pages/Attendance/utils/attendanceChartUtils";

describe("attendanceChartUtils extra coverage", () => {
  it("formats from dataIndex, value objects, raw values, and invalid totals", () => {
    const valueFormatter = vi.fn();
    expect(buildDonutSeries([{ value: 1 }], valueFormatter)).toEqual([
      expect.objectContaining({
        data: [{ value: 1 }],
        innerRadius: 40,
        outerRadius: 90,
        paddingAngle: 2,
        cornerRadius: 4,
        valueFormatter,
      }),
    ]);

    const formatter = buildValueFormatter(
      [{ value: 2 }, { value: 3 }],
      10,
    );

    expect(formatter(null, { dataIndex: 1 })).toBe("30%");
    expect(formatter({ value: 4 }, {})).toBe("40%");
    expect(formatter(5, null)).toBe("50%");
    expect(buildValueFormatter([{ value: 2 }], 0)(2, {})).toBe("");
    expect(buildValueFormatter([{ value: 2 }], 4)("oops", {})).toBe("");
  });

  it("emits click labels from the clicked item first, then falls back to indexed data", () => {
    const onSegmentClick = vi.fn();
    const handler = buildPieClickHandler(onSegmentClick, "byType", [
      { label: "Lecture" },
      { label: "Lab" },
    ]);

    handler({}, { dataIndex: 0 }, { label: "Override" });
    handler({}, { dataIndex: 1 }, {});
    handler({}, { dataIndex: 5 }, {});

    expect(onSegmentClick).toHaveBeenNthCalledWith(1, "byType", "Override");
    expect(onSegmentClick).toHaveBeenNthCalledWith(2, "byType", "Lab");
    expect(onSegmentClick).toHaveBeenCalledTimes(2);
  });
});
