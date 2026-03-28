import React from "react";
import { describe, it, expect, vi, beforeEach, useState } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectProgress from "@/pages/group_work/components/ProjectProgress";
import { useCountUp } from "@/hooks/useCountUp";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  },
}));

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: vi.fn(() => ({ current: 0 })),
}));

vi.mock("@/components/common/stat_strip/StatStrip", () => ({
  default: ({ items }) => (
    <div data-testid="stat-strip">
      {items.map((item) => (
        <div key={item.key} data-testid={`stat-${item.key}`}>
          {item.label}: {item.value}{item.suffix || ""}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

describe("ProjectProgress", () => {
  const taskStats = {
    percent: 60,
    completed: 6,
    total: 10,
    segments: [
      { id: "s1", percentage: 40, name: "Done", color: "green" },
      { id: "unassigned", percentage: 20, name: "Pending" }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders statistics correctly", () => {
    render(<ProjectProgress taskStats={taskStats} />);
    
    expect(screen.getByTestId("stat-overall")).toHaveTextContent("Overall: 60%");
    expect(screen.getByTestId("stat-complete")).toHaveTextContent("Tasks complete: 6");
    expect(screen.getByTestId("stat-remaining")).toHaveTextContent("Remaining: 4");
  });

  it("handles negative remaining edge case", () => {
    const edgeStats = { completed: 10, total: 5, percent: 100 };
    render(<ProjectProgress taskStats={edgeStats} />);
    expect(screen.getByTestId("stat-remaining")).toHaveTextContent("Remaining: 0");
  });

  it("renders segments and handles hover logic", () => {
    render(<ProjectProgress taskStats={taskStats} />);
    
    const doneSeg = screen.getByLabelText("Done segment");
    const pendingSeg = screen.getByLabelText("Pending segment");
    
    expect(doneSeg.style.background).toBe("green");
    expect(pendingSeg.style.background).toBe("var(--color-groupwork-progress)");

    // Hover logic check
    fireEvent.mouseEnter(doneSeg);
    // When doneSeg is hovered, it should have opacity 1. 
    // Wait, the style comes from buildSegmentStyle which uses hoveredSeg state.
    // I can't easily check internal state but can check the applied style.
    expect(doneSeg.style.opacity).toBe("1");
    expect(pendingSeg.style.opacity).toBe("0.65");

    fireEvent.mouseLeave(doneSeg);
    expect(pendingSeg.style.opacity).toBe("1");
  });

  it("handles segments with no IDs or colors", () => {
    const customStats = {
      segments: [{ percentage: 50, name: "Generic" }]
    };
    render(<ProjectProgress taskStats={customStats} />);
    const genSeg = screen.getByLabelText("Generic segment");
    expect(genSeg.style.background).toBe("var(--color-groupwork-progress-alt)");
  });
});
