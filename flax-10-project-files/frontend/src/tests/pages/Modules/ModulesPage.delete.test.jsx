import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const useModulesPageStateMock = vi.fn();

vi.mock("../../../pages/Modules/modulesPageHooks.js", () => ({
  useModulesPageState: (...args) => useModulesPageStateMock(...args),
}));

vi.mock("../../../pages/Modules/ModulesPageResults.jsx", () => ({
  MainView: () => <div>Main view</div>,
}));

vi.mock("../../../pages/Modules/ModulesPageChrome.jsx", () => ({
  AnimatedContent: () => <div>Animated content</div>,
  ModulesPageModals: () => <div>Page modals</div>,
  ModulesSkeleton: () => <div data-testid="modules-skeleton" />,
  TestModeContent: () => <div>Test mode content</div>,
  getViewKey: () => "modules-list",
}));

vi.mock("../../../components/common/HoldConfirmModal/HoldConfirmModal.jsx", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div>
      <span>{title}</span>
      <button onClick={onConfirm}>confirm-delete</button>
      <button onClick={onCancel}>cancel-delete</button>
    </div>
  ),
}));

import ModulesPage from "../../../pages/Modules/ModulesPage";

describe("ModulesPage delete modal", () => {
  const originalEnv = process.env.NODE_ENV;

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
});
