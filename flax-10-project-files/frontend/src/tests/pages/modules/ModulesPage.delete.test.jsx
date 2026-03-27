import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useModulesPageStateMock = vi.fn();

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/modules/ModulesPage.delete.test.jsx
vi.mock("../../../pages/modules/hooks/modulesPageHooks.js", () => ({
  useModulesPageState: (...args) => useModulesPageStateMock(...args),
}));

vi.mock("../../../pages/modules/components/ModulesPageResults.jsx", () => ({
  MainView: () => <div>Main view</div>,
}));

vi.mock("../../../pages/modules/components/ModulesPageChrome.jsx", () => ({
=======
vi.mock("../../../pages/modules/modulesPageHooks.js", () => ({
  useModulesPageState: (...args) => useModulesPageStateMock(...args),
}));

vi.mock("../../../pages/modules/ModulesPageResults.jsx", () => ({
  MainView: () => <div>Main view</div>,
}));

vi.mock("../../../pages/modules/ModulesPageChrome.jsx", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Modules/ModulesPage.delete.test.jsx
  AnimatedContent: () => <div>Animated content</div>,
  ModulesPageModals: () => <div>Page modals</div>,
  ModulesSkeleton: () => <div data-testid="modules-skeleton" />,
  TestModeContent: () => <div>Test mode content</div>,
  getViewKey: () => "modules-list",
}));

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal.jsx", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <span>{title}</span>
      <button onClick={onConfirm}>confirm-delete</button>
      <button onClick={onCancel}>cancel-delete</button>
    </div>
  ),
}));

import ModulesPage from "../../../pages/modules/ModulesPage";

describe("ModulesPage delete modal", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("renders and confirms the delete-module modal outside the test-mode shell", () => {
    process.env.NODE_ENV = "production";
    const state = {
      deletingModule: { id: 4, module_name: "Networks" },
      viewingModule: { id: 4, module_name: "Networks" },
      setDeletingModule: vi.fn(),
      setViewingModule: vi.fn(),
      hook: {
        loading: false,
        handleDirectDeleteModule: vi.fn(),
      },
    };
    useModulesPageStateMock.mockReturnValue(state);

    render(<ModulesPage />);

    expect(screen.getByText("Delete Module")).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-delete"));

    expect(state.setDeletingModule).toHaveBeenCalledWith(null);
    expect(state.hook.handleDirectDeleteModule).toHaveBeenCalledWith(
      state.deletingModule,
      expect.any(Function),
    );
  });

  it("closes the delete modal without deleting when cancel is clicked", () => {
    process.env.NODE_ENV = "production";
    const state = {
      deletingModule: { id: 7, module_name: "Databases" },
      viewingModule: { id: 7, module_name: "Databases" },
      setDeletingModule: vi.fn(),
      setViewingModule: vi.fn(),
      hook: {
        loading: false,
        handleDirectDeleteModule: vi.fn(),
      },
    };
    useModulesPageStateMock.mockReturnValue(state);

    render(<ModulesPage />);
    fireEvent.click(screen.getByText("cancel-delete"));

    expect(state.setDeletingModule).toHaveBeenCalledWith(null);
    expect(state.hook.handleDirectDeleteModule).not.toHaveBeenCalled();
  });

  it("passes initial search/create props into the page-state hook and renders the production shell", () => {
    process.env.NODE_ENV = "production";
    useModulesPageStateMock.mockReturnValue({
      deletingModule: null,
      viewingModule: null,
      showForm: false,
      hook: {
        loading: false,
      },
    });

    render(<ModulesPage initialSearch="algorithms" initialCreate />);

    expect(useModulesPageStateMock).toHaveBeenCalledWith("algorithms", true);
    expect(screen.getByText("Animated content")).toBeInTheDocument();
    expect(screen.getByText("Page modals")).toBeInTheDocument();
    expect(screen.queryByText("Delete Module")).not.toBeInTheDocument();
  });
});
