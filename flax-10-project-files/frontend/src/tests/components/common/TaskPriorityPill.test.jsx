import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import TaskPriorityPill from "../../../components/common/TaskPriorityPill/TaskPriorityPill";

describe("TaskPriorityPill", () => {
  it("renders the urgent label and marks", () => {
    render(<TaskPriorityPill priority="urgent" />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("!!!")).toBeInTheDocument();
  });

  it("falls back to medium for unknown priorities", () => {
    render(<TaskPriorityPill priority="custom" />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("!")).toBeInTheDocument();
  });

  it("accepts mixed-case input and renders low without marks", () => {
    const { container } = render(<TaskPriorityPill priority="LoW" className="extra" />);
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.queryByText("!!!")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("extra");
  });
});
