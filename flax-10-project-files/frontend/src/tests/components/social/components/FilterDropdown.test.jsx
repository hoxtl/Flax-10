import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getSocietyCategoriesMock = vi.fn(() => ["sports", "arts"]);
const matchCatMock = vi.fn((society, category) => society.categories?.[0] === category);

vi.mock("../../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      data-testid="filter-search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("../../../../components/social/components/UserSearchItems", () => ({
  CourseResultItem: ({ course, onToggle }) => <button type="button" onClick={() => onToggle(course)}>{course}</button>,
  RoleResultItem: ({ role, onToggle }) => <button type="button" onClick={() => onToggle(role.value)}>{role.label}</button>,
  SocietyResultItem: ({ society, onToggle }) => <button type="button" onClick={() => onToggle(society.id)}>{society.name}</button>,
  YearResultItem: ({ year, onToggle }) => <button type="button" onClick={() => onToggle(year)}>{year}</button>,
}));

vi.mock("../../../../components/social/components/UserSearchLists", () => ({
  EmptySearchText: ({ title, description }) => <div>{title}:{description}</div>,
}));

vi.mock("../../../../components/social/utils/userSearchUtils", () => ({
  getSocietyCategories: (...args) => getSocietyCategoriesMock(...args),
  matchCat: (...args) => matchCatMock(...args),
}));

vi.mock("../../../../components/social/utils/userSearchShared", () => ({
  FILTER_TABS: [
    { value: "roles", label: "Role" },
    { value: "courses", label: "Courses" },
    { value: "years", label: "Year" },
    { value: "societies", label: "Societies" },
  ],
  SEARCH_EMPTY_CONFIG: {
    courses: { title: "No courses found", description: "Try a different course search." },
    years: { title: "No years found", description: "Try a different year search." },
    roles: { title: "No roles found", description: "Try selecting a different role." },
    societies: { title: "No societies found", description: "Try a different society search." },
  },
  styles: new Proxy({}, { get: (_, key) => key }),
}));

import { FilterDropdown } from "../../../../components/social/components/FilterDropdown";

function buildProps(overrides = {}) {
  return {
    activeFilterTab: "courses",
    setActiveFilterTab: vi.fn(),
    filterQuery: "",
    setFilterQuery: vi.fn(),
    courseGroups: { Science: ["A", "B", "C", "D", "E", "F"] },
    courseResults: ["A", "B", "C", "D", "E", "F"],
    selectedCourses: [],
    toggleCourse: vi.fn(),
    yearResults: ["Year 1"],
    selectedYears: [],
    toggleYear: vi.fn(),
    roleResults: [{ value: "teacher", label: "Professor" }],
    selectedRoles: [],
    toggleRole: vi.fn(),
    societyResults: [{ id: 1, name: "Chess", categories: ["sports"] }],
    selectedSocieties: [],
    toggleSociety: vi.fn(),
    ...overrides,
  };
}

describe("FilterDropdown", () => {
  it("expands grouped course sections and collapses them again", () => {
    const props = buildProps();
    render(<FilterDropdown {...props} />);

    expect(screen.getByPlaceholderText("Search courses or departments...")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.queryByText("F")).toBeNull();

    fireEvent.click(screen.getByText("+ 1 more"));
    expect(screen.getByText("F")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("F")).toBeNull();

    fireEvent.click(screen.getByText("Courses"));
    expect(props.setActiveFilterTab).toHaveBeenCalledWith("courses");
  });

  it("renders empty states for course, year, and role tabs", () => {
    const { rerender } = render(<FilterDropdown {...buildProps({ courseResults: [] })} />);
    expect(screen.getByText("No courses found:Try a different course search.")).toBeInTheDocument();

    rerender(<FilterDropdown {...buildProps({ activeFilterTab: "years", yearResults: [] })} />);
    expect(screen.getByText("No years found:Try a different year search.")).toBeInTheDocument();

    rerender(<FilterDropdown {...buildProps({ activeFilterTab: "roles", roleResults: [] })} />);
    expect(screen.getByText("No roles found:Try selecting a different role.")).toBeInTheDocument();
  });

  it("skips empty grouped society sections and supports filtered flat society lists", () => {
    const props = buildProps({
      activeFilterTab: "societies",
      filterQuery: "che",
      societyResults: [{ id: 1, name: "Chess", categories: ["sports"] }],
    });

    const { rerender } = render(<FilterDropdown {...buildProps({ activeFilterTab: "societies" })} />);
    expect(screen.getByText("sports")).toBeInTheDocument();
    expect(screen.queryByText("arts")).toBeNull();

    rerender(<FilterDropdown {...props} />);
    fireEvent.change(screen.getByTestId("filter-search"), { target: { value: "bio" } });
    fireEvent.click(screen.getByText("Chess"));

    expect(props.setFilterQuery).toHaveBeenCalledWith("bio");
    expect(props.toggleSociety).toHaveBeenCalledWith(1);
  });
});
