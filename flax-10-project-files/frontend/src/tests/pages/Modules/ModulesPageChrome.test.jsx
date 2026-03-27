/**
 * Covers ModulesPageChrome view switching and modal wiring.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { createFnMap } from "../../utils/testBuilderUtils";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../components/common/loading_state/SkeletonBlock", () => ({
  default: (props) => <div data-testid="skeleton-block" {...props} />,
}));

vi.mock("../../../components/modules/modules/ModuleForm.jsx", () => ({
  default: ({ onSuccess, onCancel, module }) => (
    <div>
      <div>{module ? "Editing module" : "New module"}</div>
      <button onClick={() => onSuccess({ id: 9, module_code: "CS9" }, !module)}>Save module</button>
      <button onClick={() => onSuccess({ id: 9, module_code: "CS9" }, false)}>Save existing module</button>
      <button onClick={onCancel}>Cancel module form</button>
    </div>
  ),
}));

vi.mock("../../../components/modules/modules/ModuleDetails.jsx", () => ({
  default: ({ module, onBack, onEnroll, onUnenroll }) => (
    <div>
      <div>{module.module_code}</div>
      <button onClick={onBack}>Back from details</button>
      <button onClick={onEnroll}>Enroll now</button>
      <button onClick={onUnenroll}>Leave now</button>
    </div>
  ),
}));

vi.mock("../../../components/modules/Deadlines/DeadlineModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Deadline ${module.module_code}`}</div>
      <button onClick={onClose}>Close deadline</button>
    </div>
  ),
}));

vi.mock("../../../components/modules/Readings/ReadingModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Reading ${module.module_code}`}</div>
      <button onClick={onClose}>Close reading</button>
    </div>
  ),
}));

vi.mock("../../../components/common/standard_modal/StandardModal.jsx", () => ({
  default: ({ title, subtitle, onClose, children }) => (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <button onClick={onClose}>Close modal</button>
      {children}
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
} from "../../../pages/modules/ModulesPageChrome";

const buildHookState = (overrides = {}) => ({
  enrollments: [],
  ...createFnMap(["handleModuleCreated", "handleModuleUpdated", "handleEnrollment", "handleDisenrol"]),
  ...overrides,
});

function buildState(overrides = {}) {
  const { hook, ...rest } = overrides;
  return {
    hook: buildHookState(hook),
    editingModule: null,
    viewingModule: { id: 1, module_code: "CS101", module_name: "Intro" },
    showForm: false,
    deadlineModule: null,
    readingModule: null,
    ...createFnMap(["setShowForm", "setEditingModule", "setViewingModule", "setSearchQuery", "setDeadlineModule", "setReadingModule"]),
    ...rest,
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
    expect(getViewKey(false, { module_code: "CS204" })).toBe("modules-details-CS204");
    expect(getViewKey(false, {})).toBe("modules-details-active");

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
    expect(state.setSearchQuery).toHaveBeenCalledWith("");
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

  it("renders reading-only modals when the page is idle", () => {
    const state = buildState({
      viewingModule: null,
      deadlineModule: null,
      readingModule: { module_code: "MA202" },
    });
    render(<ModulesPageModals state={state} />);
    expect(screen.getByText("Reading MA202")).toBeInTheDocument();
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
    const detailsState = buildState({ showForm: false, viewingModule: { id: 2, module_code: "CS2" } });
    rerender(<TestModeContent state={detailsState} MainView={MainView} />);
    expect(screen.getByText("CS2")).toBeInTheDocument();
    const listState = buildState({ showForm: false, viewingModule: null, deadlineModule: { module_code: "CS3" } });
    rerender(<TestModeContent state={listState} MainView={MainView} />);
    expect(screen.getByText("Main list")).toBeInTheDocument();
    expect(screen.getByText("Deadline CS3")).toBeInTheDocument();
    const editState = buildState({ showForm: true, viewingModule: null, editingModule: { id: 3 } });
    rerender(<AnimatedContent state={editState} viewKey="edit" MainView={MainView} />);
    fireEvent.click(screen.getByText("Save module"));
    expect(editState.hook.handleModuleUpdated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });
    expect(editState.setEditingModule).toHaveBeenCalledWith(null);
    expect(editState.setShowForm).toHaveBeenCalledWith(false);
    const freshState = buildState({ showForm: true, viewingModule: null, editingModule: null });
    rerender(<AnimatedContent state={freshState} viewKey="create" MainView={MainView} />);
    fireEvent.click(screen.getByText("Cancel module form"));
    expect(freshState.setShowForm).toHaveBeenCalledWith(false);
    expect(freshState.setEditingModule).toHaveBeenCalledWith(null);
  });

  it("creates a module from the create modal flow", () => {
    const state = buildState({ showForm: true, viewingModule: null, editingModule: null });
    render(<AnimatedContent state={state} viewKey="create" MainView={() => null} />);
    fireEvent.click(screen.getByText("Save module"));
    expect(state.hook.handleModuleCreated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });
    expect(state.setShowForm).toHaveBeenCalledWith(false);
    expect(state.setEditingModule).toHaveBeenCalledWith(null);
  });

  it("ignores create-modal updates when the form reports an existing module", () => {
    const state = buildState({ showForm: true, viewingModule: null, editingModule: null });
    render(<AnimatedContent state={state} viewKey="create" MainView={() => null} />);
    fireEvent.click(screen.getByText("Save existing module"));
    expect(state.hook.handleModuleCreated).not.toHaveBeenCalled();
    expect(state.setShowForm).toHaveBeenCalledWith(false);
    expect(state.setEditingModule).toHaveBeenCalledWith(null);
  });

  it("renders the animated detail and list panes when not editing", () => {
    const detailsState = buildState({ showForm: false, viewingModule: { id: 5, module_code: "CS5" } });
    const MainView = ({ state }) => <div>{state.viewingModule ? "details" : "list"}</div>;

    const { rerender } = render(<AnimatedContent state={detailsState} viewKey="details" MainView={MainView} />);
    expect(screen.getByText("CS5")).toBeInTheDocument();

    const listState = buildState({ showForm: false, viewingModule: null, deadlineModule: null });
    rerender(<AnimatedContent state={listState} viewKey="list" MainView={MainView} />);
    expect(screen.getByText("list")).toBeInTheDocument();
  });

  it("closes edit and create modals through StandardModal", () => {
    const editState = buildState({ showForm: true, viewingModule: null, editingModule: { id: 4 } });
    const { rerender } = render(<AnimatedContent state={editState} viewKey="edit" MainView={() => null} />);
    fireEvent.click(screen.getByText("Cancel module form"));
    expect(editState.setShowForm).toHaveBeenCalledWith(false);
    expect(editState.setEditingModule).toHaveBeenCalledWith(null);

    rerender(<AnimatedContent state={editState} viewKey="edit" MainView={() => null} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(editState.setShowForm).toHaveBeenCalledWith(false);
    expect(editState.setEditingModule).toHaveBeenCalledWith(null);

    const createState = buildState({ showForm: true, viewingModule: null, editingModule: null });
    rerender(<AnimatedContent state={createState} viewKey="create" MainView={() => null} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(createState.setShowForm).toHaveBeenCalledWith(false);
    expect(createState.setEditingModule).toHaveBeenCalledWith(null);
  });
});
