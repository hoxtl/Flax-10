import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useModulesPageStateMock = vi.fn();
const getViewKeyMock = vi.fn(() => "details-key");
const handleDirectDeleteModuleMock = vi.fn();

vi.mock("../../../pages/Modules/modulesPageHooks.js", () => ({
  useModulesPageState: (...args) => useModulesPageStateMock(...args),
}));

vi.mock("../../../pages/Modules/ModulesPageResults.jsx", () => ({
  MainView: () => <div data-testid="main-view">main view</div>,
}));

vi.mock("../../../pages/Modules/ModulesPageChrome.jsx", () => ({
  AnimatedContent: ({ state, viewKey }) => <div data-testid="animated-content">{`${viewKey}:${state.viewingModule?.module_code || "none"}`}</div>,
  getViewKey: (...args) => getViewKeyMock(...args),
  ModulesPageModals: ({ state }) => <div data-testid="page-modals">{state.readingModule ? "has-reading" : "no-reading"}</div>,
  ModulesSkeleton: () => <div data-testid="modules-skeleton">loading</div>,
  TestModeContent: () => <div data-testid="test-mode">test mode</div>,
}));

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal.jsx", () => ({
  default: ({ onConfirm, onCancel, warningText }) => (
    <div>
      <div>{warningText}</div>
      <button onClick={onConfirm}>confirm delete</button>
      <button onClick={onCancel}>cancel delete</button>
    </div>
  ),
}));

import ModulesPage from "../../../pages/Modules/ModulesPage.jsx";

describe("ModulesPage production branch", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    useModulesPageStateMock.mockReturnValue({
      hook: {
        loading: false,
        handleDirectDeleteModule: handleDirectDeleteModuleMock,
      },
      showForm: false,
      viewingModule: { id: 1, module_code: "CS101" },
      readingModule: { id: 9 },
      deletingModule: { id: 5, module_name: "Logic" },
      setDeletingModule: vi.fn(),
      setViewingModule: vi.fn(),
    });
  });

  it("renders the animated production content, modals, and delete confirm flow", () => {
    render(<ModulesPage initialSearch="logic" initialCreate />);

    expect(useModulesPageStateMock).toHaveBeenCalledWith("logic", true);
    expect(getViewKeyMock).toHaveBeenCalledWith(false, { id: 1, module_code: "CS101" });
    expect(screen.getByTestId("animated-content")).toHaveTextContent("details-key:CS101");
    expect(screen.getByTestId("page-modals")).toHaveTextContent("has-reading");
    expect(screen.getByText(/are you sure you want to delete "Logic"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("confirm delete"));

    const state = useModulesPageStateMock.mock.results[0].value;
    expect(state.setDeletingModule).toHaveBeenCalledWith(null);
    expect(handleDirectDeleteModuleMock).toHaveBeenCalledWith(
      { id: 5, module_name: "Logic" },
      expect.any(Function),
    );

    handleDirectDeleteModuleMock.mock.calls[0][1]();
    expect(state.setViewingModule).toHaveBeenCalledWith(null);
  });

  it("lets cancel dismiss the delete modal", () => {
    render(<ModulesPage />);
    const state = useModulesPageStateMock.mock.results[0].value;
    fireEvent.click(screen.getByText("cancel delete"));
    expect(state.setDeletingModule).toHaveBeenCalledWith(null);
    expect(screen.queryByTestId("test-mode")).not.toBeInTheDocument();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
});
