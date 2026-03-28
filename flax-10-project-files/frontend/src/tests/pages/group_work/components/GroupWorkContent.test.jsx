import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  mockAnimatedDropdown,
  mockCompareProjectsBySort,
  mockSearchEmptyState,
  resetGroupWorkContentMocks,
} from "./__mocks__/groupWorkContentMocks";
import GroupWorkContent from "@/pages/group_work/components/GroupWorkContent";

describe("GroupWorkContent", () => {
  const setSortBy = vi.fn();
  const onProjectCreated = vi.fn();
  const projectListProps = vi.fn(() => ({}));
  const projects = [
    { id: 1, name: "Alpha" },
    { id: 2, name: "Beta" },
  ];

  beforeEach(() => {
    resetGroupWorkContentMocks();
  });

  const renderContent = (overrides = {}) =>
    render(
      <GroupWorkContent
        projects={overrides.projects ?? projects}
        projectListProps={overrides.projectListProps ?? projectListProps}
        sortBy={overrides.sortBy ?? "due-date"}
        setSortBy={overrides.setSortBy ?? setSortBy}
        onProjectCreated={overrides.onProjectCreated ?? onProjectCreated}
      />
    );

  it("renders project list and handles sorting", () => {
    renderContent();
    expect(screen.getByTestId("project-row-1")).toBeTruthy();
    expect(screen.getByTestId("project-row-2")).toBeTruthy();
    fireEvent.change(screen.getByTestId("sort-dropdown"), { target: { value: "name" } });
    expect(setSortBy).toHaveBeenCalledWith("name");
  });

  it("filters projects based on search term", () => {
    renderContent();
    fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "Al" } });
    expect(screen.getByTestId("project-row-1")).toBeTruthy();
    expect(screen.queryByTestId("project-row-2")).toBeNull();
  });

  it("shows empty state when no projects match search", () => {
    renderContent();
    fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "Zeta" } });
    expect(mockSearchEmptyState).toHaveBeenCalled();
    expect(screen.getByText("No projects match your search.")).toBeTruthy();
  });

  it("shows empty state when no projects exist", () => {
    renderContent({ projects: [] });
    expect(screen.getByText("No group projects yet.")).toBeTruthy();
  });

  it("handles project creation callback", () => {
    renderContent({ projects: [] });
    fireEvent.click(screen.getByTestId("create-project"));
    expect(onProjectCreated).toHaveBeenCalledWith({ id: 99 });
  });

  it("calls compareProjectsBySort for each comparison", () => {
    renderContent();
    expect(mockCompareProjectsBySort).toHaveBeenCalled();
    expect(mockCompareProjectsBySort.mock.calls[0][2]).toBe("due-date");
  });

  it("offers a latest-first due date sort option", () => {
    renderContent();
    const [[{ options }]] = mockAnimatedDropdown.mock.calls;
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "due-date-desc", label: "Due date (latest first)" }),
      ]),
    );
  });

  it("handles projects without names during filtering", () => {
    const unnamed = [{ id: 3, name: null }, { id: 4, name: "Gamma" }];
    renderContent({ projects: unnamed });
    fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "Gam" } });
    expect(screen.getByTestId("project-row-4")).toBeTruthy();
  });
});
