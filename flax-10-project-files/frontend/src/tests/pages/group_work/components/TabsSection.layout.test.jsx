import { it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const tabsPropsMock = vi.fn();

vi.mock("@/components/common/tabs/Tabs", () => ({
  default: (props) => {
    tabsPropsMock(props);
    return (
      <div data-testid="tabs-mock">
        {props.tabs?.map((t) => (
          <span key={t.id}>{t.label}</span>
        ))}
      </div>
    );
  },
}));

vi.mock("@/pages/group_work/components/GroupTasksTab", () => ({
  default: ({ projectId }) => <div data-testid="tasks-tab">tasks-{projectId}</div>,
}));

vi.mock("@/pages/group_work/components/AvailabilityTab", () => ({
  default: ({ projectId }) => <div data-testid="availability-tab">avail-{projectId}</div>,
}));

vi.mock("@/pages/group_work/components/ProjectProgress", () => ({
  default: ({ taskStats }) => <div data-testid="project-progress">{taskStats?.percent}%</div>,
}));

import TabsSection from "@/pages/group_work/components/TabsSection";

afterEach(() => {
  tabsPropsMock.mockClear();
});

it("renders ProjectProgress and passes tab config into Tabs", () => {
  const setActiveTab = vi.fn();
  render(
    <TabsSection
      activeTab="tasks"
      setActiveTab={setActiveTab}
      projectId={7}
      members={[{ id: 1 }]}
      onStatsUpdate={vi.fn()}
      taskStats={{ percent: 40 }}
    />
  );

  expect(screen.getByTestId("project-progress")).toHaveTextContent("40%");
  expect(screen.getByText("Tasks")).toBeInTheDocument();
  expect(screen.getByText("Schedule meeting slots")).toBeInTheDocument();

  const received = tabsPropsMock.mock.calls.at(-1)?.[0];
  expect(received.tabs).toHaveLength(2);
  expect(received.tabs[0].id).toBe("tasks");
  expect(received.tabs[1].id).toBe("availability");
  expect(received.activeTab).toBe("tasks");
  expect(received.onTabChange).toBe(setActiveTab);
  expect(received.layoutId).toBe("group-project-detail-tabs");
  expect(received.tabVariant).toBe("heading");
});
