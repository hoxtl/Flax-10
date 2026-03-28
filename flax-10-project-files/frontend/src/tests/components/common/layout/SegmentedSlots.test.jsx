import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  SegmentedDivider,
  SegmentedSlot,
  SegmentedSlots,
} from "../../../../components/common/segmented_slots/SegmentedSlots";

describe("SegmentedSlots", () => {
  it("renders the segmented container and default slot markup", () => {
    const { container } = render(
      <SegmentedSlots>
        <SegmentedSlot>Overview</SegmentedSlot>
        <SegmentedDivider />
      </SegmentedSlots>,
    );

    expect(screen.getByText("Overview").tagName).toBe("DIV");
    expect(screen.getByText("Overview").className).toContain("slot");
    expect(container.firstChild.className).toContain("container");
    expect(container.querySelector('[aria-hidden="true"]').className).toContain("divider");
  });

  it("renders button slots with grow styling and a default button type", () => {
    render(
      <SegmentedSlot as="button" grow className="cta">
        Save
      </SegmentedSlot>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("slotGrow");
    expect(button.className).toContain("cta");
  });

  it("preserves explicit button types and forwards props for non-button slots", () => {
    const { rerender } = render(
      <SegmentedSlot as="button" type="submit">
        Publish
      </SegmentedSlot>,
    );

    expect(screen.getByRole("button", { name: "Publish" })).toHaveAttribute("type", "submit");

    rerender(
      <SegmentedSlot as="section" data-testid="section-slot" className="panel">
        Body
      </SegmentedSlot>,
    );

    expect(screen.getByTestId("section-slot").tagName).toBe("SECTION");
    expect(screen.getByTestId("section-slot").className).toContain("panel");
    expect(screen.getByTestId("section-slot")).not.toHaveAttribute("type");
  });
});
