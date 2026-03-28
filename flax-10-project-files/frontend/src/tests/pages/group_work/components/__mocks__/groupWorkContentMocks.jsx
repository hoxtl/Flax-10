import React from "react";
import { vi } from "vitest";

export const mockCompareProjectsBySort = vi.fn((a, b) => a.name.localeCompare(b.name));
export const mockProjectRow = vi.fn(({ project }) => (
  <div data-testid={`project-row-${project.id}`}>{project.name}</div>
));
export const mockCreateProjectForm = vi.fn(({ onCreated }) => (
  <button type="button" data-testid="create-project" onClick={() => onCreated({ id: 99 })}>
    Create
  </button>
));
export const mockSearchEmptyState = vi.fn(({ title, hint }) => (
  <div data-testid="search-empty-state">
    <span>{title}</span>
    <span>{hint}</span>
  </div>
));
export const mockPageToolbar = vi.fn(({ controlsSlot }) => (
  <div data-testid="page-toolbar">{controlsSlot}</div>
));
export const mockToolbarSortControl = vi.fn(({ children }) => <div>{children}</div>);
export const mockAnimatedDropdown = vi.fn(({ value, onChange, options }) => (
  <select data-testid="sort-dropdown" value={value} onChange={(event) => onChange(event.target.value)}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
));
export const mockSearchBar = vi.fn(({ value, onChange }) => (
  <input data-testid="search-bar" value={value} onChange={(event) => onChange(event.target.value)} />
));

vi.mock("@/components/common/page_toolbar/PageToolbar", () => ({
  default: (props) => mockPageToolbar(props),
  ToolbarSortControl: (props) => mockToolbarSortControl(props),
}));

vi.mock("@/components/common/animated_dropdown", () => ({
  default: (props) => mockAnimatedDropdown(props),
}));

vi.mock("@/components/common/search_bar/SearchBar", () => ({
  default: (props) => mockSearchBar(props),
}));

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: (props) => mockSearchEmptyState(props),
}));

vi.mock("@/pages/group_work/components/CreateProjectForm", () => ({
  default: (props) => mockCreateProjectForm(props),
}));

vi.mock("@/pages/group_work/components/ProjectRow", () => ({
  default: (props) => mockProjectRow(props),
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  compareProjectsBySort: (...args) => mockCompareProjectsBySort(...args),
}));

export function resetGroupWorkContentMocks() {
  mockCompareProjectsBySort.mockClear();
  mockProjectRow.mockClear();
  mockCreateProjectForm.mockClear();
  mockSearchEmptyState.mockClear();
  mockPageToolbar.mockClear();
  mockToolbarSortControl.mockClear();
  mockAnimatedDropdown.mockClear();
  mockSearchBar.mockClear();
}
