import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TabsSection from "@/pages/group_work/components/TabsSection";

vi.mock("@/components/common/tabs/Tabs", () => ({
  default: ({ tabs, activeTab }) => (
    <div data-testid="tabs-mock">
      {tabs.map(t => (
        <div key={t.id} data-testid={`tab-content-${t.id}`}>
          {activeTab === t.id && t.content}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/GroupTasksTab", () => ({
  default: () => <div data-testid="tasks-tab">Tasks Tab</div>,
}));

vi.mock("@/pages/group_work/components/AvailabilityTab", () => ({
  default: () => <div data-testid="availability-tab">Availability Tab</div>,
}));

vi.mock("@/pages/group_work/components/ProjectProgress", () => ({
  default: () => <div data-testid="progress-mock">Progress</div>,
}));

describe("TabsSection", () => {
  const props = {
    activeTab: "tasks",
    setActiveTab: vi.fn(),
    projectId: 1,
    members: [],
    onStatsUpdate: vi.fn(),
    taskStats: {},
  };

  it("renders correctly and shows active tab content", () => {
    const { rerender } = render(<TabsSection {...props} />);
    
    expect(screen.getByTestId("progress-mock")).toBeTruthy();
    expect(screen.getByTestId("tasks-tab")).toBeTruthy();
    expect(screen.queryByTestId("availability-tab")).toBeNull();

    rerender(<TabsSection {...props} activeTab="availability" />);
    expect(screen.getByTestId("availability-tab")).toBeTruthy();
    expect(screen.queryByTestId("tasks-tab")).toBeNull();
  });
});
