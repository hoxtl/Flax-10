import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "./__mocks__/projectHeaderMetaHarness.jsx";
import { getProjectDateMock, getStoredViewerMock, resetProjectHeaderHarness } from "./__mocks__/projectHeaderHarness";
import ProjectHeader from "@/pages/group_work/components/ProjectHeader";

describe("ProjectHeader", () => {
  const onBack = vi.fn();
  const project = { id: 1, name: "Project", course_code: "CS101", module_name: "SE", deadline: "2026-03-28" };

  beforeEach(() => {
    resetProjectHeaderHarness();
  });

  const renderHeader = (overrides = {}) => {
    const resolveValue = (key, fallback) =>
      Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : fallback;

    return render(
      <MemoryRouter>
        <ProjectHeader
          project={overrides.project ?? project}
          members={resolveValue("members", [])}
          teamMembers={resolveValue("teamMembers", [])}
          onBack={overrides.onBack ?? onBack}
          onDelete={overrides.onDelete}
          onMemberAdded={overrides.onMemberAdded}
          onMemberRemove={overrides.onMemberRemove}
          onUpdate={overrides.onUpdate}
        />
      </MemoryRouter>
    );
  };

  it("renders with full data and owner status", () => {
    getStoredViewerMock.mockReturnValue({ id: "v1" });
    renderHeader({ teamMembers: [{ user: "v1", role: "owner" }] });
    expect(screen.getByText("Project")).toBeTruthy();
    expect(screen.getByText("CS101 SE")).toBeTruthy();
    expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("true");
    expect(screen.getByTestId("deadline-countdown")).toBeTruthy();
  });

  it("renders without deadline and module pill", () => {
    getProjectDateMock.mockReturnValue(null);
    renderHeader({ project: { ...project, course_code: null, module_name: null } });
    expect(screen.queryByTestId("deadline-countdown")).toBeNull();
    expect(screen.queryByLabelText(/Open/)).toBeNull();
  });

  it("handles empty viewer or teamMember results in false owner", () => {
    getStoredViewerMock.mockReturnValue(null);
    renderHeader({ teamMembers: [] });
    expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("false");
  });

  it("renders module pill with code only", () => {
    renderHeader({ project: { ...project, course_code: "CODE", module_name: null } });
    expect(screen.getByText("CODE")).toBeTruthy();
  });

  it("renders module pill with name only", () => {
    renderHeader({ project: { ...project, course_code: null, module_name: "NAME" } });
    expect(screen.getByText("NAME")).toBeTruthy();
  });

  it("renders module pill with code and name", () => {
    renderHeader({ project: { ...project, course_code: "CODE", module_name: "NAME" } });
    expect(screen.getByText("CODE NAME")).toBeTruthy();
  });

  it("handles back button click", () => {
    renderHeader();
    fireEvent.click(screen.getByText("Back to all projects"));
    expect(onBack).toHaveBeenCalled();
  });

  it("treats viewer user id as owner", () => {
    getStoredViewerMock.mockReturnValue({ user: "u2" });
    renderHeader({ teamMembers: [{ user: "u2", role: "owner" }] });
    expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("true");
  });

  it("handles undefined teamMembers", () => {
    getStoredViewerMock.mockReturnValue({ id: "v1" });
    renderHeader({ teamMembers: undefined });
    expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("false");
  });

  it("handles owner entry without user id", () => {
    getStoredViewerMock.mockReturnValue({ id: "v1" });
    renderHeader({ teamMembers: [{ role: "owner" }] });
    expect(screen.getByTestId("project-header-actions").dataset.isOwner).toBe("false");
  });
});
