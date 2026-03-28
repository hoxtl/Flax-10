import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GroupProjectDetail from "@/pages/group_work/components/GroupWorkDetail";
import { useProjectDetail } from "@/pages/group_work/hooks/groupWorkHooks";

vi.mock("@/pages/group_work/hooks/groupWorkHooks", () => ({
  useProjectDetail: vi.fn(),
}));

vi.mock("@/pages/group_work/components/GroupWorkDetailSkeleton", () => ({
  default: () => <div data-testid="skeleton">Skeleton</div>,
}));

vi.mock("@/components/common/app_page/AppPage", () => ({
  default: ({ children }) => <div data-testid="app-page">{children}</div>,
}));

vi.mock("@/components/common/empty_state/EmptyState", () => ({
  default: ({ title }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@/components/common/back_button/BackButton.jsx", () => ({
  default: ({ label }) => <button>{label}</button>,
}));

vi.mock("@/components/common/Breadcrumb/Breadcrumb.jsx", () => ({
  default: ({ crumbs }) => <div data-testid="breadcrumb">{crumbs.map(c => c.label).join(" > ")}</div>,
}));

vi.mock("@/pages/group_work/components/ProjectHeader", () => ({
  default: ({ project }) => <div data-testid="project-header">{project.name}</div>,
}));

vi.mock("@/components/common/tabs/Tabs", () => ({
  default: ({ tabs, activeTab }) => (
    <div data-testid="tabs-mock">
      {tabs.map((tab) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          {activeTab === tab.id ? tab.content : null}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/GroupTasksTab", () => ({
  default: () => <div data-testid="tasks-tab" />,
}));

vi.mock("@/pages/group_work/components/AvailabilityTab", () => ({
  default: () => <div data-testid="availability-tab" />,
}));

vi.mock("@/pages/group_work/components/ProjectProgress", () => ({
  default: () => <div data-testid="progress-mock" />,
}));


vi.mock("@/components/pagination/Pagination", () => ({
  BackToTop: () => <div data-testid="back-to-top">BackToTop</div>,
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getVisibleMembers: vi.fn((m) => m),
}));

describe("GroupProjectDetail", () => {
  const projectId = 1;
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    useProjectDetail.mockReturnValue({ loading: true });
    render(<GroupProjectDetail projectId={projectId} onBack={onBack} />);
    expect(screen.getByTestId("skeleton")).toBeTruthy();
  });

  it("renders missing project state", () => {
    useProjectDetail.mockReturnValue({ loading: false, project: null });
    render(<GroupProjectDetail projectId={projectId} onBack={onBack} />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent("This group project isn’t available right now.");
  });

  it("renders project content successfully", () => {
    const project = { id: 1, name: "My Team Project" };
    const members = [{ id: 101, name: "Alice" }];
    useProjectDetail.mockReturnValue({
      loading: false,
      project,
      members,
      activeTab: "tasks",
      setActiveTab: vi.fn(),
      taskStats: {},
      setTaskStats: vi.fn(),
      onAdded: vi.fn(),
      handleRemoveMember: vi.fn(),
      handleDeleteProject: vi.fn(),
      setProject: vi.fn(),
    });

    render(<GroupProjectDetail projectId={projectId} onBack={onBack} />);
    
    expect(screen.getByTestId("project-header")).toHaveTextContent("My Team Project");
    expect(screen.getByTestId("breadcrumb")).toHaveTextContent("Group Work > My Team Project");
  expect(screen.getByTestId("tabs-mock")).toBeTruthy();
    expect(screen.getByTestId("back-to-top")).toBeTruthy();
  });
});
