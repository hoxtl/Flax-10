import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const sidebarMock = vi.fn((props) => <div data-testid="sidebar" data-props={JSON.stringify(props)} />);
const mapPaneMock = vi.fn((props) => <div data-testid="map-pane" data-props={JSON.stringify(props)} />);
const quickNavMock = vi.fn(({ onFly }) => (
  <button type="button" onClick={() => onFly({ id: "strand", name: "Strand", coords: [-0.1, 51.5] })}>
    Quick fly
  </button>
));
const pageHeaderMock = vi.fn((props) => <div data-testid="page-header" data-props={JSON.stringify(props)} />);
const skeletonBlockMock = vi.fn(({ className }) => <div data-testid="skeleton-block" className={className} />);

vi.mock("../../pages/CampusMap/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../pages/CampusMap/sidebar.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/sidebar.module.css", () => ({ default: {} }));

vi.mock("../../../components/CampusMap/CampusMapSidebar", () => ({
  CampusMapSidebar: (props) => sidebarMock(props),
}));

vi.mock("../../../components/CampusMap/CampusMapMapPane", () => ({
  CampusMapMapPane: (props) => mapPaneMock(props),
}));

vi.mock("../../../components/CampusMap/CampusQuickNav", () => ({
  CampusQuickNav: (props) => quickNavMock(props),
}));

vi.mock("../../../components/common/PageHeader/PageHeader", () => ({
  default: (props) => pageHeaderMock(props),
}));

vi.mock("../../../components/common/LoadingState/SkeletonBlock", () => ({
  default: (props) => skeletonBlockMock(props),
}));

import { CampusMapShell } from "../../../components/CampusMap/CampusMapShell";
import { CampusMapMapPane } from "../../../components/CampusMap/CampusMapMapPane";
import { SidebarHeader } from "../../../components/CampusMap/SidebarHeader";

describe("CampusMapShell", () => {
  it("renders the initial skeleton and forwards props to the layout panes", () => {
    const props = {
      showInitialSkeleton: true,
      ui: { isMobile: false },
      flyToCampus: vi.fn(),
      mapContainer: vi.fn(),
      disruptions: [],
      loadingDisruptions: false,
    };

    const { rerender } = render(<CampusMapShell {...props} />);

    expect(screen.getByTestId("campus-map-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("map-pane")).toBeInTheDocument();
    expect(sidebarMock).toHaveBeenCalledWith(expect.objectContaining(props));
    expect(mapPaneMock).toHaveBeenCalledWith(expect.objectContaining(props));

    rerender(<CampusMapShell {...props} showInitialSkeleton={false} />);

    expect(screen.queryByTestId("campus-map-skeleton")).toBeNull();
  });
});

describe("CampusMapMapPane", () => {
  it("hides the map pane while the skeleton is visible and triggers quick nav fly", () => {
    const flyToCampus = vi.fn();
    const mapContainer = vi.fn();

    const { container, rerender } = render(
      <CampusMapMapPane flyToCampus={flyToCampus} mapContainer={mapContainer} showInitialSkeleton={true} />
    );

    expect(container.firstChild.style.visibility).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: /quick fly/i }));
    expect(flyToCampus).toHaveBeenCalledWith({ id: "strand", name: "Strand", coords: [-0.1, 51.5] });

    rerender(<CampusMapMapPane flyToCampus={flyToCampus} mapContainer={mapContainer} showInitialSkeleton={false} />);
    expect(container.firstChild.style.visibility).toBe("");
    expect(mapContainer).toHaveBeenCalled();
  });
});

describe("SidebarHeader", () => {
  it("renders the page title and subtitle", () => {
    render(<SidebarHeader />);

    expect(screen.getByTestId("page-header")).toBeInTheDocument();
    expect(pageHeaderMock).toHaveBeenCalledWith({
      title: "🌎 StudyFlax Map",
      subtitle: "Never be late, plan your journeys!",
    });
  });
});

describe("CampusMapSkeleton", () => {
  it("renders the skeleton overlay structure", () => {
    render(<CampusMapShell showInitialSkeleton={true} ui={{ isMobile: false }} flyToCampus={vi.fn()} mapContainer={vi.fn()} disruptions={[]} loadingDisruptions={false} />);

    expect(screen.getByTestId("campus-map-skeleton")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "")).toBeTruthy();
    expect(skeletonBlockMock).toHaveBeenCalled();
    expect(screen.getAllByTestId("skeleton-block").length).toBeGreaterThan(0);
  });
});
