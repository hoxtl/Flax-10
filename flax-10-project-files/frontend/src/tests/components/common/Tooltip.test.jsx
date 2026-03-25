import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Tooltip from "../../../components/common/Tooltip/Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  });

  it("does not render a tooltip until hovered and hides it on leave", () => {
    render(
      <Tooltip content="Helpful text">
        <button>Trigger</button>
      </Tooltip>
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByText("Trigger").parentElement, {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 }) },
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful text");
    fireEvent.mouseLeave(screen.getByText("Trigger").parentElement);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports alternate positions and class names", () => {
    const { rerender } = render(
      <Tooltip content="Bottom tip" position="bottom" wrapperClassName="wrap" className="tip">
        <span>Item</span>
      </Tooltip>
    );

    const wrapper = screen.getByText("Item").parentElement;
    wrapper.getBoundingClientRect = () => ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 });
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip")).toHaveClass("tip");

    fireEvent.mouseLeave(wrapper);
    rerender(
      <Tooltip content="Left tip" position="left">
        <span>Item</span>
      </Tooltip>
    );
    const leftWrapper = screen.getByText("Item").parentElement;
    leftWrapper.getBoundingClientRect = () => ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 });
    fireEvent.mouseEnter(leftWrapper);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Left tip");

    fireEvent.mouseLeave(leftWrapper);
    rerender(
      <Tooltip content="Right tip" position="right">
        <span>Item</span>
      </Tooltip>
    );
    const rightWrapper = screen.getByText("Item").parentElement;
    rightWrapper.getBoundingClientRect = () => ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 });
    fireEvent.mouseEnter(rightWrapper);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Right tip");
  });

  it("does not render a tooltip when the content is empty even after hover", () => {
    render(
      <Tooltip content={null}>
        <span>No tip</span>
      </Tooltip>
    );

    const wrapper = screen.getByText("No tip").parentElement;
    wrapper.getBoundingClientRect = () => ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 });
    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
