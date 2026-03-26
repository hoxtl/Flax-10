import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GridCard from "../../../components/common/card/GridCard";

describe("GridCard", () => {
  it("renders with default className trimming and custom style", () => {
    render(
      <GridCard style={{ color: "rgb(255, 0, 0)" }}>
        <span>Card body</span>
      </GridCard>,
    );

    const card = screen.getByText("Card body").parentElement;
    expect(card).toHaveTextContent("Card body");
    expect(card.className).not.toMatch(/\s{2,}/);
    expect(card).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("applies the custom className and forwards clicks", () => {
    const onClick = vi.fn();

    render(
      <GridCard className="extra-card" onClick={onClick}>
        <span>Clickable</span>
      </GridCard>,
    );

    const card = screen.getByText("Clickable").closest("div");
    expect(card.className).toContain("extra-card");

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
