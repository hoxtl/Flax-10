import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../components/common/LoadingState/SkeletonBlock", () => ({
  default: (props) => <div data-testid="skeleton-block" {...props} />,
}));

vi.mock("../../../components/Modules/Modules/ModuleForm.jsx", () => ({
  default: ({ onSuccess, onCancel, module }) => (
    <div>
      <div>{module ? "Editing module" : "New module"}</div>
      <button onClick={() => onSuccess({ id: 9, module_code: "CS9" }, !module)}>Save module</button>
      <button onClick={onCancel}>Cancel module form</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Modules/ModuleDetails.jsx", () => ({
  default: ({ module, onBack, onEnroll, onUnenroll }) => (
    <div>
      <div>{module.module_code}</div>
      <button onClick={onBack}>Back from details</button>
      <button onClick={onEnroll}>Enroll now</button>
      <button onClick={onUnenroll}>Leave now</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Deadlines/DeadlineModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Deadline ${module.module_code}`}</div>
      <button onClick={onClose}>Close deadline</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Readings/ReadingModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Reading ${module.module_code}`}</div>
      <button onClick={onClose}>Close reading</button>
    </div>
  ),
}));

import {
  AnimatedContent,
  DetailsView,
  FormView,
  getViewKey,
  ModulesPageModals,
  ModulesSkeleton,
  TestModeContent,
} from "../../../pages/Modules/ModulesPageChrome";

function buildState(overrides = {}) {
  return {
    hook: {
      handleModuleCreated: vi.fn(),
      handleModuleUpdated: vi.fn(),
      handleEnrollment: vi.fn(),
      handleDisenrol: vi.fn(),
      enrollments: [],
      ...overrides.hook,
    },
    editingModule: null,
    viewingModule: { id: 1, module_code: "CS101", module_name: "Intro" },
    showForm: false,
    setShowForm: vi.fn(),
    setEditingModule: vi.fn(),
    setViewingModule: vi.fn(),
    setSearchQuery: vi.fn(),
    deadlineModule: null,
    setDeadlineModule: vi.fn(),
    readingModule: null,
    setReadingModule: vi.fn(),
    ...overrides,
  };
}

describe("ModulesPageChrome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("covers view keys and skeleton rendering", () => {
    expect(getViewKey(true, null)).toBe("modules-form");
    expect(getViewKey(false, null)).toBe("modules-list");
    expect(getViewKey(false, { id: 7 })).toBe("modules-details-7");

    render(<ModulesSkeleton />);
    expect(screen.getByTestId("modules-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(13);
  });

  it("form view handles create, update, and cancel", () => {
    const state = buildState({ showForm: true, viewingModule: null });
    const { rerender } = render(<FormView state={state} />);

    fireEvent.click(screen.getByText("Save module"));
    expect(state.hook.handleModuleCreated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });
    expect(state.setShowForm).toHaveBeenCalledWith(false);

    const editState = buildState({ showForm: true, viewingModule: null, editingModule: { id: 3 } });
    rerender(<FormView state={editState} />);
    fireEvent.click(screen.getByText("Save module"));
    expect(editState.hook.handleModuleUpdated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });

    fireEvent.click(screen.getByText("Cancel module form"));
    expect(editState.setShowForm).toHaveBeenCalledWith(false);
  });

  it("details view wires back, enroll, and unenroll", () => {
    const state = buildState();
    render(<DetailsView state={state} />);
    fireEvent.click(screen.getByText("Enroll now"));
    fireEvent.click(screen.getByText("Leave now"));
    fireEvent.click(screen.getByText("Back from details"));
    expect(state.hook.handleEnrollment).toHaveBeenCalledWith(state.viewingModule);
    expect(state.hook.handleDisenrol).toHaveBeenCalledWith(state.viewingModule);
    expect(state.setViewingModule).toHaveBeenCalledWith(null);
  });

  it("renders and closes modals", () => {
    const state = buildState({
      viewingModule: null,
      deadlineModule: { module_code: "CS101" },
      readingModule: { module_code: "MA202" },
    });
    render(<ModulesPageModals state={state} />);
    fireEvent.click(screen.getByText("Close deadline"));
    fireEvent.click(screen.getByText("Close reading"));
    expect(state.setDeadlineModule).toHaveBeenCalledWith(null);
    expect(state.setReadingModule).toHaveBeenCalledWith(null);
  });

  it("returns null for page modals when form or details are active", () => {
    const { rerender, container } = render(<ModulesPageModals state={buildState({ showForm: true })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ModulesPageModals state={buildState({ viewingModule: { id: 1, module_code: "CS101" } })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("covers test-mode and animated content branches", () => {
    const MainView = ({ state }) => <div>{`Main ${state.viewingModule ? "details" : "list"}`}</div>;

    const createState = buildState({ showForm: true, viewingModule: null, editingModule: null });
    const { rerender } = render(<TestModeContent state={createState} MainView={MainView} />);
    expect(screen.getByText("New module")).toBeInTheDocument();

    const detailsState = buildState({ showForm: false, viewingModule: { id: 2, module_code: "CS202", module_name: "Algorithms" } });
    rerender(<TestModeContent state={detailsState} MainView={MainView} />);
    expect(screen.getByText("CS202")).toBeInTheDocument();

    const listState = buildState({ showForm: false, viewingModule: null, deadlineModule: { module_code: "CS303" } });
    rerender(<TestModeContent state={listState} MainView={MainView} />);
    expect(screen.getByText("Main list")).toBeInTheDocument();
    expect(screen.getByText("Deadline CS303")).toBeInTheDocument();

    const editState = buildState({ showForm: true, viewingModule: null, editingModule: { id: 3, module_code: "CS303" } });
    rerender(<AnimatedContent state={editState} viewKey="edit" MainView={MainView} />);
    fireEvent.click(screen.getByText("Save module"));
    expect(editState.hook.handleModuleUpdated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });
    expect(editState.setEditingModule).toHaveBeenCalledWith(null);

    const freshState = buildState({ showForm: true, viewingModule: null, editingModule: null });
    rerender(<AnimatedContent state={freshState} viewKey="create" MainView={MainView} />);
    fireEvent.click(screen.getByText("Cancel module form"));
    expect(freshState.setShowForm).toHaveBeenCalledWith(false);
  });
});
