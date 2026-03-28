import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimelineRowLayout, TimelineGutter, TimelineSpineCell } from "@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout";

const styles = {
  planTimelineRow: "row",
  planTimelineGutter: "gutter",
  planTimelineTime: "time",
  planTimelineSpineCell: "spine",
};

describe("TimelineRowLayout", () => {
  it("renders children with spacingBefore style", () => {
    const { container } = render(
      <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={56} rowClassName="gap">
        <span>Child</span>
      </TimelineRowLayout>
    );
    expect(screen.getByText("Child")).toBeTruthy();
    const div = container.firstChild;
    expect(div.style.marginTop).toBe("12px");
    expect(div.style.minHeight).toBe("56px");
  });

  it("renders without spacingBeforePx (defaults to 0)", () => {
    const { container } = render(
      <TimelineRowLayout row={{}} styles={styles} minHeight={40}>
        <span>X</span>
      </TimelineRowLayout>
    );
    expect(container.firstChild.style.marginTop).toBe("0px");
  });
});

describe("TimelineGutter", () => {
  it("renders time label when hideTimeLabel is false", () => {
    render(<TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="9:00 AM" />);
    expect(screen.getByText("9:00 AM")).toBeTruthy();
  });

  it("hides time label when hideTimeLabel is true", () => {
    render(<TimelineGutter row={{ hideTimeLabel: true }} styles={styles} timeLabel="9:00 AM" />);
    expect(screen.queryByText("9:00 AM")).toBeNull();
  });
});

describe("TimelineSpineCell", () => {
  it("renders aria-hidden div", () => {
    const { container } = render(<TimelineSpineCell styles={styles} />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });
});
