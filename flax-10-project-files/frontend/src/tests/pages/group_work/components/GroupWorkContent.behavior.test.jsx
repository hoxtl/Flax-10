import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { resetGroupWorkContentMocks } from "./__mocks__/groupWorkContentMocks";
import GroupWorkContent from "@/pages/group_work/components/GroupWorkContent";

const projects = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
];
const projectListProps = vi.fn(() => ({ onClick: vi.fn() }));

beforeEach(() => {
  resetGroupWorkContentMocks();
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
  expect(screen.getAllByTestId(/project-row-/)).toHaveLength(2);
});

it("shows empty state when no projects", () => {
  renderContent({ projects: [] });
  expect(screen.getByTestId("search-empty-state")).toBeTruthy();
  expect(screen.getByText("No group projects yet.")).toBeTruthy();
});

it("filters projects by search term", () => {
  renderContent();
  fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "Alpha" } });
  expect(screen.getAllByTestId(/project-row-/)).toHaveLength(1);
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
  expect(screen.getByTestId("create-project")).toBeTruthy();
});
