import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const sidebarMock = vi.fn((props) => <div data-testid="sidebar" data-props={JSON.stringify(props)} />);
const pageHeaderMock = vi.fn((props) => <div data-testid="page-header" data-props={JSON.stringify(props)} />);
const skeletonBlockMock = vi.fn(({ className }) => <div data-testid="skeleton-block" className={className} />);

vi.mock("../../pages/campus_map/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../pages/campus_map/Sidebar.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/styles/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/styles/sidebar.module.css", () => ({ default: {} }));

vi.mock("../../../components/campus_map/CampusMapSidebar", () => ({
  CampusMapSidebar: (props) => sidebarMock(props),
}));

vi.mock("../../../components/common/page_header/PageHeader", () => ({
  default: (props) => pageHeaderMock(props),
}));

vi.mock("../../../components/common/loading_state/SkeletonBlock", () => ({
  default: (props) => skeletonBlockMock(props),
}));

import { CampusMapShell } from "../../../components/campus_map/CampusMapShell";
import { SidebarHeader } from "../../../components/campus_map/SidebarHeader";

beforeEach(() => {
  vi.clearAllMocks();
});

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
    expect(sidebarMock).toHaveBeenCalledWith(expect.objectContaining(props));

    rerender(<CampusMapShell {...props} showInitialSkeleton={false} />);

    expect(screen.queryByTestId("campus-map-skeleton")).toBeNull();
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
    expect(skeletonBlockMock).toHaveBeenCalled();
    expect(screen.getAllByTestId("skeleton-block").length).toBeGreaterThan(0);
  });
});
