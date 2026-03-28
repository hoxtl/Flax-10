import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectRowAccordion from "@/pages/group_work/components/ProjectRowAccordion";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  },
}));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

describe("ProjectRowAccordion", () => {
  it("renders with percentage and tooltip", () => {
    const { container } = render(<ProjectRowAccordion percent={75} />);
    expect(screen.getByLabelText("75% completion")).toBeTruthy();
    expect(container.querySelector('[data-tooltip="75% complete"]')).toBeTruthy();
  });

  it("handles 0 percentage", () => {
    render(<ProjectRowAccordion percent={0} />);
    expect(screen.getByLabelText("0% completion")).toBeTruthy();
  });
});
