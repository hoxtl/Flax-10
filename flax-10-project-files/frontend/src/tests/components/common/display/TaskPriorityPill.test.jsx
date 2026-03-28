import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import TaskPriorityPill from "../../../../components/common/task_priority_pill/TaskPriorityPill";

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

  it("falls back to the default medium priority when the value is null and supports compact mode", () => {
    const { container } = render(<TaskPriorityPill priority={null} compact />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(container.firstChild.className).toContain("compact");
  });

  it("uses the default medium priority when no priority prop is provided", () => {
    render(<TaskPriorityPill />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });
});
