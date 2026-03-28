import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { HomepageOverlays } from "../../../../pages/homepage/components/HomepageOverlays";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

vi.mock("./ModulePill", () => ({
  ModulePill: ({ moduleCode }) => <span data-testid="module-pill">{moduleCode}</span>,
  TypePill: ({ typeLabel }) => <span data-testid="type-pill">{typeLabel}</span>,
  getModulePillColors: () => ({ bg: "white", text: "black", accent: "blue" }),
}));

const mockStyles = {
  deadlineDetailOverlay: "overlay",
  moduleCardCard: "module-card",
  moduleCardHeader: "header",
  moduleCardColorBar: "colorbar",
  moduleCardCode: "code",
  moduleCardName: "name",
  moduleCardDept: "dept",
  moduleCardDesc: "desc",
  moduleCardLeader: "leader",
  moduleCardDivider: "divider",
  moduleCardActions: "actions",
  moduleCardLink: "link",
  deadlineDetailCard: "deadline-card",
  deadlineDetailTitle: "title",
  deadlineDetailDate: "date",
  deadlineDetailDesc: "dead-desc",
  deadlineDetailMeta: "meta",
  deadlineDetailMetaIcon: "meta-icon",
  deadlineDetailActions: "dead-actions",
  deadlineDetailLink: "dead-link",
  deadlineDetailHeader: "dead-header",
  deadlineDetailPills: "dead-pills",
};

describe("HomepageOverlays", () => {
  describe("ModuleOverlay", () => {
    it("returns null when no module pill is selected", () => {
      const { container } = render(<HomepageOverlays selectedModulePill={null} styles={mockStyles} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders module details correctly", () => {
      const selected = { code: "XYZ123", id: 1 };
      const enrolled = [{ id: 1, name: "I", school: "S", description: "D", leader: "L" }];
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={enrolled} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getAllByText(/XYZ123/i)).toBeTruthy();
      expect(screen.getByText("I")).toBeTruthy();
    });

    it("truncates long description", () => {
      const selected = { code: "C1" };
      const longDesc = "A".repeat(150);
      const enrolled = [{ module_code: "C1", description: longDesc }];
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={enrolled} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText((c) => c.includes("A".repeat(120)))).toBeTruthy();
    });

    it("navigates to module page on button click", () => {
      const setSelected = vi.fn();
      render(<MemoryRouter><HomepageOverlays selectedModulePill={{ id: 1 }} setSelectedModulePill={setSelected} styles={mockStyles} /></MemoryRouter>);
      fireEvent.click(screen.getByText("View module"));
      expect(setSelected).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith("/modules?moduleId=1");
    });

    it("handles fallback name and leader labels", () => {
      const selected = { code: "C2", id: 2 };
      const enrolled = [{ id: "2", module_name: "N", department: "D", module_leader: "UNIQUE_LEADER" }];
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={enrolled} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText("N")).toBeTruthy();
      expect(screen.getByText("D")).toBeTruthy();
      expect(screen.getByText(/UNIQUE_LEADER/i)).toBeTruthy();
    });

    it("handles missing enrolledModules fallback", () => {
      const selected = { code: "ABC_UNIQUE" };
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={undefined} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getAllByText(/ABC_UNIQUE/i)).toBeTruthy();
    });

    it("matches module by code case-insensitively", () => {
      const selected = { code: "cs101" };
      const enrolled = [{ module_code: "CS101", name: "Matched" }];
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={enrolled} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText("Matched")).toBeTruthy();
    });

    it("handles item without module_code", () => {
      const selected = { code: "C4" };
      const enrolled = [{ id: 4, name: "N4" }];
      render(<MemoryRouter><HomepageOverlays selectedModulePill={selected} enrolledModules={enrolled} styles={mockStyles} /></MemoryRouter>);
      expect(screen.queryByText("N4")).toBeNull();
    });

    it("closes on backdrop click", () => {
      const setSelected = vi.fn();
      render(<MemoryRouter><HomepageOverlays selectedModulePill={{ code: "C" }} setSelectedModulePill={setSelected} styles={mockStyles} /></MemoryRouter>);
      fireEvent.click(screen.getByRole("dialog"));
      expect(setSelected).toHaveBeenCalledWith(null);
    });
    
    it("does not close on card click", () => {
        const setSelected = vi.fn();
        render(<MemoryRouter><HomepageOverlays selectedModulePill={{ code: "C" }} setSelectedModulePill={setSelected} styles={mockStyles} /></MemoryRouter>);
        fireEvent.click(screen.getByRole("heading", { name: /C/i }).parentElement);
        expect(setSelected).not.toHaveBeenCalled();
    });
  });

  describe("DeadlineOverlay", () => {
    it("returns null when no deadline is selected", () => {
      const { container } = render(<HomepageOverlays selectedDeadline={null} styles={mockStyles} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders deadline details correctly", () => {
      const deadline = { title: "Exam", start_due_date: "2026-06-01", description: "Final", location: "Hall", module_code: "CS1", deadline_type: "quiz" } ;
      render(<MemoryRouter><HomepageOverlays selectedDeadline={deadline} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText("Exam")).toBeTruthy();
    });

    it("closes deadline on backdrop click", () => {
      const setSelected = vi.fn();
      const d = { title: "T" };
      render(<MemoryRouter><HomepageOverlays selectedDeadline={d} setSelectedDeadline={setSelected} styles={mockStyles} /></MemoryRouter>);
      fireEvent.click(screen.getByRole("dialog"));
      expect(setSelected).toHaveBeenCalledWith(null);
    });

    it("handles missing start_due_date", () => {
      const d = { title: "T" };
      render(<MemoryRouter><HomepageOverlays selectedDeadline={d} styles={mockStyles} /></MemoryRouter>);
      expect(screen.queryByText(/Due:/)).toBeNull();
    });

    it("handles module_id or module fallback in URL", () => {
      const setSelected = vi.fn();
      const d = { module_id: 123 };
      render(<MemoryRouter><HomepageOverlays selectedDeadline={d} setSelectedDeadline={setSelected} styles={mockStyles} /></MemoryRouter>);
      fireEvent.click(screen.getByText("Go to module"));
      expect(setSelected).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith("/modules?moduleId=123");
    });

    it("navigates to module page via module property", () => {
      const setSelected = vi.fn();
      const d = { module: 456 };
      render(<MemoryRouter><HomepageOverlays selectedDeadline={d} setSelectedDeadline={setSelected} styles={mockStyles} /></MemoryRouter>);
      fireEvent.click(screen.getByText("Go to module"));
      expect(mockNavigate).toHaveBeenCalledWith("/modules?moduleId=456");
    });

    it("returns null from getDeadlineModuleUrl when coding missing", () => {
        const setSelected = vi.fn();
        const d = { title: "T" };
        const { container } = render(<MemoryRouter><HomepageOverlays selectedDeadline={d} setSelectedDeadline={setSelected} styles={mockStyles} /></MemoryRouter>);
        expect(screen.queryByText("Go to module")).toBeNull();
    });

    it("truncates long description and capitalizes type", () => {
      const d = { title: "T", deadline_type: "quiz", description: "A".repeat(150) };
      render(<MemoryRouter><HomepageOverlays selectedDeadline={d} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText("Quiz")).toBeTruthy();
      expect(screen.getByText((c) => c.includes("A".repeat(120)))).toBeTruthy();
    });
  });
});
