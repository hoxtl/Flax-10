import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/pages/group_work/components/ProjectRow", () => ({
  default: ({ project }) => <div data-testid="project-row">{project.name}</div>,
}));

vi.mock("@/pages/group_work/components/CreateProjectForm", () => ({
  default: ({ onCreated }) => (
    <button type="button" data-testid="create-project-form" onClick={onCreated}>Create</button>
  ),
}));

vi.mock("@/components/common/page_toolbar/PageToolbar", () => ({
  default: ({ controlsSlot }) => <div data-testid="page-toolbar">{controlsSlot}</div>,
  ToolbarSortControl: ({ children }) => <div data-testid="sort-control">{children}</div>,
}));

vi.mock("@/components/common/animated_dropdown", () => ({
  default: ({ value, onChange, options }) => (
    <select data-testid="sort-dropdown" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));

vi.mock("@/components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange }) => (
    <input data-testid="search-bar" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => (
    <div data-testid="search-empty-state">
      <p>{title}</p>
      <p>{hint}</p>
    </div>
  ),
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  compareProjectsBySort: vi.fn(() => 0),
}));

import GroupWorkContent from "@/pages/group_work/components/GroupWorkContent";

const projects = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
];
const projectListProps = vi.fn(() => ({ onClick: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  projectListProps.mockImplementation(() => ({ onClick: vi.fn() }));
});

const renderContent = (overrides = {}) =>
  render(
    <GroupWorkContent
      projects={overrides.projects ?? projects}
      projectListProps={overrides.projectListProps ?? projectListProps}
      sortBy="name"
      setSortBy={vi.fn()}
      onProjectCreated={vi.fn()}
    />,
  );

it("renders project rows when projects are present", () => {
  renderContent();
  expect(screen.getAllByTestId("project-row")).toHaveLength(2);
});

it("shows empty state when no projects", () => {
  renderContent({ projects: [] });
  expect(screen.getByTestId("search-empty-state")).toBeTruthy();
  expect(screen.getByText("No group projects yet.")).toBeTruthy();
});

it("filters projects by search term", () => {
  renderContent();
  fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "Alpha" } });
  expect(screen.getAllByTestId("project-row")).toHaveLength(1);
  expect(screen.getByText("Alpha")).toBeTruthy();
});

it("shows searching empty state when search has no matches", () => {
  renderContent();
  fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "zzz" } });
  expect(screen.getByText("No projects match your search.")).toBeTruthy();
});

it("renders sort dropdown", () => {
  renderContent();
  expect(screen.getByTestId("sort-dropdown")).toBeTruthy();
});

it("renders create project form", () => {
  renderContent();
  expect(screen.getByTestId("create-project-form")).toBeTruthy();
});
