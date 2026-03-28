import { beforeEach, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const useProjectDetailMock = vi.fn();

vi.mock("@/pages/group_work/hooks/groupWorkHooks", () => ({
  useProjectDetail: (...args) => useProjectDetailMock(...args),
}));

vi.mock("@/pages/group_work/components/ProjectHeader", () => ({
  default: ({ project }) => <div data-testid="project-header">{project.name}</div>,
}));

vi.mock("@/pages/group_work/components/TabsSection", () => ({
  default: () => <div data-testid="tabs-section" />,
}));

vi.mock("@/components/common/app_page/AppPage", () => ({
  default: ({ children }) => <div data-testid="app-page">{children}</div>,
}));

vi.mock("@/components/common/Breadcrumb/Breadcrumb.jsx", () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

vi.mock("@/components/pagination/Pagination", () => ({
  BackToTop: () => <button type="button" data-testid="back-to-top" />,
}));

vi.mock("@/components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => (
    <button type="button" onClick={onClick}>{label}</button>
  ),
}));

vi.mock("@/components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getVisibleMembers: vi.fn((m) => m ?? []),
}));

vi.mock("lucide-react", () => ({
  FolderOpen: () => <svg data-testid="icon-folder" />,
}));

import GroupProjectDetail from "@/pages/group_work/components/GroupWorkDetail";

const baseDetail = {
  loading: false,
  project: { id: 1, name: "Proj" },
  members: [],
  taskStats: {},
  activeTab: "tasks",
  setActiveTab: vi.fn(),
  setTaskStats: vi.fn(),
  setProject: vi.fn(),
  handleDeleteProject: vi.fn(),
  handleRemoveMember: vi.fn(),
  onAdded: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useProjectDetailMock.mockReturnValue(baseDetail);
});

it("renders project header when project is loaded", () => {
  render(<GroupProjectDetail projectId={1} onBack={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);
  expect(screen.getByTestId("project-header")).toHaveTextContent("Proj");
});

it("renders tabs section when project is loaded", () => {
  render(<GroupProjectDetail projectId={1} onBack={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);
  expect(screen.getByTestId("tabs-section")).toBeTruthy();
});

it("renders skeleton while loading", () => {
  useProjectDetailMock.mockReturnValue({ ...baseDetail, loading: true, project: null });
  render(<GroupProjectDetail projectId={1} onBack={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);
  expect(screen.getByTestId("groupwork-skeleton")).toBeTruthy();
});

it("renders missing project state when project is null", () => {
  useProjectDetailMock.mockReturnValue({ ...baseDetail, project: null });
  render(<GroupProjectDetail projectId={1} onBack={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />);
  expect(screen.getByTestId("empty-state")).toBeTruthy();
  expect(screen.getByText("Back to My Group Projects")).toBeTruthy();
});
