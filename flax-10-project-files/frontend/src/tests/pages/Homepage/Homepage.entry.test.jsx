import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useHomepageControllerMock = vi.fn();
const dashboardMock = vi.fn();
const appToastMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../pages/Homepage/hooks/useHomepageController", () => ({
  useHomepageController: (...args) => useHomepageControllerMock(...args),
}));

vi.mock("../../../pages/Homepage/components/HomepageDashboard", () => ({
  HomepageDashboard: (props) => {
    dashboardMock(props);
    return <div data-testid="homepage-dashboard">dashboard</div>;
  },
}));

vi.mock("../../../components/common/AppToast/AppToast", () => ({
  default: (props) => {
    appToastMock(props);
    return <button onClick={props.onClose}>close toast</button>;
  },
}));

import Homepage from "../../../pages/Homepage/Homepage.jsx";

describe("Homepage entry", () => {
  it("passes route defaults into the controller and renders the dashboard", () => {
    useHomepageControllerMock.mockReturnValue({
      toast: { fallbackToast: null, setFallbackToast: vi.fn(), toastApi: { push: vi.fn() } },
      greeting: "hello",
    });

    render(<Homepage defaultShowCreateTaskModal defaultPlanTimelineReadItem={{ id: 7 }} />);

    expect(useHomepageControllerMock).toHaveBeenCalledWith(true, { id: 7 });
    expect(screen.getByTestId("homepage-dashboard")).toBeInTheDocument();
    expect(dashboardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        greeting: "hello",
        toast: expect.any(Object),
      }),
    );
    expect(appToastMock).not.toHaveBeenCalled();
  });

  it("shows the fallback toast only when no toast api exists and closes it through the controller setter", () => {
    const setFallbackToast = vi.fn();
    useHomepageControllerMock.mockReturnValue({
      toast: {
        fallbackToast: { message: "Saved" },
        setFallbackToast,
        toastApi: null,
      },
    });

    render(<Homepage />);
    fireEvent.click(screen.getByRole("button", { name: "close toast" }));

    expect(appToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Saved",
        onClose: expect.any(Function),
      }),
    );
    expect(setFallbackToast).toHaveBeenCalledWith(null);
  });
});
