/**
 * Extra branch-coverage tests for CampusMap components.
 * Targets: CampusMapSidebar, TflStatusSection, TransportModesSection,
 *          TflRouteCard, WalkingRouteCard, DestinationSection,
 *          LocationChip, CampusQuickNav, CampusMapSidebarContent, mapUtils.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── module-level mocks ────────────────────────────────────────────────────────

vi.mock("../../pages/CampusMap/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../pages/CampusMap/sidebar.module.css", () => ({ default: {} }));
vi.mock("../../pages/CampusMap/status.module.css", () => ({ default: {} }));
vi.mock("../../pages/CampusMap/routes.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/sidebar.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/status.module.css", () => ({ default: {} }));
vi.mock("../../../pages/CampusMap/routes.module.css", () => ({ default: {} }));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const { animate: _a, drag: _d, dragConstraints: _dc, dragElastic: _de, initial: _i, transition: _t, variants: _v, layout: _l, ...rest } = props;
          return <div {...rest}>{children}</div>;
        },
    },
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/CampusMap/CampusMapSidebarContent", () => ({
  CampusMapSidebarContent: () => <div data-testid="sidebar-content" />,
}));

vi.mock("../../../lib/kclCampuses", () => ({
  KCL_CAMPUSES: [
    { id: "strand", name: "Strand Campus", shortName: "Strand", coords: [-0.116, 51.5114], address: "Strand, London WC2R 2LS", color: "#e63f3f" },
    { id: "guys", name: "Guy's Campus", shortName: "Guy's", coords: [-0.089, 51.504], address: "Great Maze Pond, London SE1 9RT", color: "#2b7ff4" },
  ],
}));

vi.mock("../../../components/Calendar/EventModal/components/LocationAutoComplete", () => ({
  LocationAutocomplete: ({ value, onChange, placeholder }) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  ),
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../api/geocodeApi", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ latitude: 51.5, longitude: -0.1 }),
}));

vi.mock("./UserJourneySection.module.css", () => ({ default: {} }));
vi.mock("../../../components/CampusMap/UserJourneySection.module.css", () => ({ default: {} }));
vi.mock("../../components/CampusMap/UserJourneySection.module.css", () => ({ default: {} }));

// ── helpers for importing after mocks ─────────────────────────────────────────

import {
  travelTime,
  travelDistance,
  getPriorityColor,
  getLegIcon,
  getLegLabel,
} from "../../../components/CampusMap/mapUtils";

import { TflStatusSection } from "../../../components/CampusMap/TflStatusSection";
import { TransportModesSection } from "../../../components/CampusMap/TransportModesSection";
import { TflRouteCard } from "../../../components/CampusMap/TflRouteCard";
import { WalkingRouteCard } from "../../../components/CampusMap/WalkingRouteCard";
import { DestinationSection } from "../../../components/CampusMap/DestinationSection";
import { LocationChip } from "../../../components/CampusMap/LocationChip";
import { CampusQuickNav } from "../../../components/CampusMap/CampusQuickNav";
import { CampusMapSidebar } from "../../../components/CampusMap/CampusMapSidebar";

// ── mapUtils ──────────────────────────────────────────────────────────────────

describe("mapUtils – travelTime", () => {
  it("returns singular minute for exactly 60 seconds", () => {
    expect(travelTime(60)).toBe("1 min");
  });

  it("returns plural mins for less than 1 hour", () => {
    expect(travelTime(300)).toBe("5 mins");
  });

  it("formats hours and leftover minutes for >= 60 minutes", () => {
    expect(travelTime(3960)).toBe("1h 6m");
  });

  it("returns 0 mins for 0 seconds", () => {
    expect(travelTime(0)).toBe("0 mins");
  });
});

describe("mapUtils – travelDistance", () => {
  it("returns metres when under 1000", () => {
    expect(travelDistance(450)).toBe("450 m");
  });

  it("returns km when 1000 or over", () => {
    expect(travelDistance(2500)).toBe("2.5 km");
  });
});

describe("mapUtils – getPriorityColor", () => {
  it("returns known priority colour", () => {
    expect(getPriorityColor("urgent")).toBe("var(--map-priority-urgent)");
  });

  it("falls back to medium for unknown priority", () => {
    expect(getPriorityColor("unknown")).toBe("var(--map-priority-medium)");
  });
});

describe("mapUtils – getLegIcon", () => {
  it("returns correct icon for known modes", () => {
    expect(getLegIcon("bus")).toBe("🚌");
    expect(getLegIcon("walking")).toBe("🚶");
    expect(getLegIcon("tube")).toBe("🚇");
  });

  it("falls back to 🚇 for unknown mode", () => {
    expect(getLegIcon("spaceship")).toBe("🚇");
  });
});

describe("mapUtils – getLegLabel", () => {
  it("returns 'Walk' for walking mode", () => {
    expect(getLegLabel({ mode: "walking", routeOptions: [] })).toBe("Walk");
  });

  it("returns bus with route name for bus mode", () => {
    expect(getLegLabel({ mode: "bus", routeOptions: [{ name: "42" }] })).toBe("Bus 42");
  });

  it("falls back to route option name for other modes", () => {
    expect(getLegLabel({ mode: "tube", routeOptions: [{ name: "Jubilee" }] })).toBe("Jubilee");
  });

  it("falls back to mode when routeOptions is empty for non-walking/bus mode", () => {
    expect(getLegLabel({ mode: "dlr", routeOptions: [] })).toBe("dlr");
  });

  it("returns 'Bus ' with trailing space when bus has no route name", () => {
    expect(getLegLabel({ mode: "bus", routeOptions: [{ name: "" }] })).toBe("Bus ");
  });
});

// ── TflStatusSection ──────────────────────────────────────────────────────────

describe("TflStatusSection", () => {
  it("renders loading spinner when loading is true", () => {
    const { container } = render(<TflStatusSection disruptions={[]} loading={true} />);
    expect(container.textContent).toContain("Checking TfL Line status...");
  });

  it("renders GoodService when no disruptions and not loading", () => {
    render(<TflStatusSection disruptions={[]} loading={false} />);
    expect(screen.getByText("Good Service!")).toBeTruthy();
    expect(screen.getByText("All TfL lines are running normally")).toBeTruthy();
  });

  it("renders a disruption card for each disruption", () => {
    const disruptions = [
      { lineName: "Northern", severityDescription: "Severe", reason: "Signal failure", color: "#000" },
      { lineName: "Central", severityDescription: "Minor", reason: "Delays", color: "#f00" },
    ];
    render(<TflStatusSection disruptions={disruptions} loading={false} />);
    expect(screen.getByText(/Northern/)).toBeTruthy();
    expect(screen.getByText(/Central/)).toBeTruthy();
  });

  it("truncates and allows expanding disruptions when more than 2", () => {
    const disruptions = [
      { lineName: "A", severityDescription: "Minor", reason: "R", color: "#0a0" },
      { lineName: "B", severityDescription: "Minor", reason: "R", color: "#0b0" },
      { lineName: "C", severityDescription: "Minor", reason: "R", color: "#0c0" },
    ];
    render(<TflStatusSection disruptions={disruptions} loading={false} />);
    // Show More button should be visible
    const showMoreBtn = screen.getByRole("button", { name: /Show 1 More/i });
    expect(showMoreBtn).toBeTruthy();

    // Click to expand
    fireEvent.click(showMoreBtn);
    expect(screen.getByText(/Show Less/)).toBeTruthy();

    // Click to collapse
    fireEvent.click(screen.getByRole("button", { name: /Show Less/i }));
    expect(screen.getByRole("button", { name: /Show 1 More/i })).toBeTruthy();
  });

  it("does not show Show More button with exactly 2 disruptions", () => {
    const disruptions = [
      { lineName: "A", severityDescription: "Minor", reason: "R", color: "#0a0" },
      { lineName: "B", severityDescription: "Minor", reason: "R", color: "#0b0" },
    ];
    render(<TflStatusSection disruptions={disruptions} loading={false} />);
    expect(screen.queryByRole("button", { name: /Show/i })).toBeNull();
  });
});

// ── TransportModesSection ─────────────────────────────────────────────────────

describe("TransportModesSection", () => {
  const baseProps = {
    startLocation: null,
    selectedCampus: null,
    customDestination: null,
    routeInfo: null,
    routeError: null,
    loadingRoute: false,
    tflRouteInfo: null,
    tflRouteError: null,
    loadingTflRoute: false,
    walkingInstructions: false,
    tflInstructions: false,
    onToggleWalking: vi.fn(),
    onToggleTfl: vi.fn(),
  };

  it("renders empty state when no start location", () => {
    render(<TransportModesSection {...baseProps} />);
    expect(screen.getByText(/Set a starting location/)).toBeTruthy();
  });

  it("renders empty state when start set but no destination", () => {
    render(<TransportModesSection {...baseProps} startLocation={{ lat: 51.5, lng: -0.1 }} />);
    expect(screen.getByText(/Set a starting location/)).toBeTruthy();
  });

  it("renders loading spinner when loadingRoute is true", () => {
    render(
      <TransportModesSection
        {...baseProps}
        startLocation={{ lat: 51.5, lng: -0.1 }}
        selectedCampus={{ id: "strand" }}
        loadingRoute={true}
      />,
    );
    expect(screen.getByText(/Calculating route.../)).toBeTruthy();
  });

  it("renders route error when routeError is provided", () => {
    render(
      <TransportModesSection
        {...baseProps}
        startLocation={{ lat: 51.5, lng: -0.1 }}
        selectedCampus={{ id: "strand" }}
        routeError="Route not found"
      />,
    );
    expect(screen.getByText("Route not found")).toBeTruthy();
  });

  it("renders null when routeInfo is null and there is no error or loading", () => {
    const { container } = render(
      <TransportModesSection
        {...baseProps}
        startLocation={{ lat: 51.5, lng: -0.1 }}
        selectedCampus={{ id: "strand" }}
      />,
    );
    // should not render route cards
    expect(container.textContent).not.toContain("Walking");
  });

  it("renders route cards when routeInfo is provided", () => {
    const routeInfo = { duration: 600, distance: 800, steps: [] };
    render(
      <TransportModesSection
        {...baseProps}
        startLocation={{ lat: 51.5, lng: -0.1 }}
        selectedCampus={{ id: "strand" }}
        routeInfo={routeInfo}
      />,
    );
    expect(screen.getByText("Walking")).toBeTruthy();
  });
});

// ── TflRouteCard ──────────────────────────────────────────────────────────────

describe("TflRouteCard", () => {
  it("renders loading card when loading is true", () => {
    render(<TflRouteCard loading={true} />);
    expect(screen.getByText("Checking public transport...")).toBeTruthy();
  });

  it("renders error card when error is provided", () => {
    render(<TflRouteCard loading={false} error="TfL API down" />);
    expect(screen.getByText("TfL API down")).toBeTruthy();
  });

  it("renders null when no tflRouteInfo and no error/loading", () => {
    const { container } = render(<TflRouteCard loading={false} error={null} tflRouteInfo={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders route details when tflRouteInfo is provided", () => {
    const tflRouteInfo = {
      duration: 25,
      legs: [
        { mode: "tube", routeOptions: [{ name: "Jubilee" }], departurePoint: "London Bridge", arrivalPoint: "Waterloo", duration: 10 },
      ],
    };
    render(<TflRouteCard loading={false} error={null} tflRouteInfo={tflRouteInfo} instructionMode={false} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("Public Transport")).toBeTruthy();
    expect(screen.getByText("25 min")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy(); // 1 stop
  });

  it("shows step-by-step directions when instructionMode is true", () => {
    const tflRouteInfo = {
      duration: 15,
      legs: [
        { mode: "walking", routeOptions: [], departurePoint: "Home", arrivalPoint: "Station", duration: 5 },
      ],
    };
    render(<TflRouteCard loading={false} error={null} tflRouteInfo={tflRouteInfo} instructionMode={true} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("Home → Station")).toBeTruthy();
  });

  it("toggles directions on button click", () => {
    const onToggle = vi.fn();
    const tflRouteInfo = { duration: 10, legs: [] };
    render(<TflRouteCard loading={false} error={null} tflRouteInfo={tflRouteInfo} instructionMode={false} onToggleInstructions={onToggle} />);
    fireEvent.click(screen.getByText(/Show step-by-step directions/));
    expect(onToggle).toHaveBeenCalled();
  });
});

// ── WalkingRouteCard ──────────────────────────────────────────────────────────

describe("WalkingRouteCard", () => {
  const routeInfo = {
    duration: 600,
    distance: 800,
    steps: [
      { instruction: "Head north on Strand", distance: 200, duration: 120 },
      { instruction: "Turn left onto Aldwych", distance: 150, duration: 90 },
    ],
  };

  it("renders duration and distance", () => {
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={false} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("10 mins")).toBeTruthy();
    expect(screen.getByText("800 m")).toBeTruthy();
  });

  it("shows directions toggle button", () => {
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={false} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText(/Show directions/)).toBeTruthy();
  });

  it("shows step list when instructionMode is true", () => {
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={true} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("Head north on Strand")).toBeTruthy();
    expect(screen.getByText("Turn left onto Aldwych")).toBeTruthy();
  });

  it("calls onToggleInstructions when button is clicked", () => {
    const onToggle = vi.fn();
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={false} onToggleInstructions={onToggle} />);
    fireEvent.click(screen.getByText(/Show directions/));
    expect(onToggle).toHaveBeenCalled();
  });
});

// ── DestinationSection ────────────────────────────────────────────────────────

describe("DestinationSection", () => {
  const baseProps = {
    selectedCampus: null,
    customDestination: null,
    onClearCampus: vi.fn(),
    onClearCustomDest: vi.fn(),
    onSelectCampus: vi.fn(),
  };

  it("renders hint text when no campus or custom destination", () => {
    render(<DestinationSection {...baseProps} />);
    expect(screen.getByText(/Select a campus or event as destination/)).toBeTruthy();
  });

  it("renders selected campus chip", () => {
    const campus = { id: "strand", name: "Strand Campus", address: "Strand, London", color: "#e63f3f" };
    render(<DestinationSection {...baseProps} selectedCampus={campus} />);
    expect(screen.getByText("Strand Campus")).toBeTruthy();
  });

  it("renders custom destination chip over campus", () => {
    const campus = { id: "strand", name: "Strand Campus", address: "Strand, London", color: "#e63f3f" };
    const custom = { name: "Current location", address: "51.5, -0.1" };
    render(<DestinationSection {...baseProps} selectedCampus={campus} customDestination={custom} />);
    expect(screen.getByText("Current location")).toBeTruthy();
    // Strand Campus chip should not be shown since custom overrides
    expect(screen.queryByText("Strand Campus")).not.toBeInTheDocument();
  });

  it("calls onSelectCampus when campus button clicked", () => {
    const onSelectCampus = vi.fn();
    render(<DestinationSection {...baseProps} onSelectCampus={onSelectCampus} />);
    // KCL_CAMPUSES mocked to have Strand + Guy's
    const buttons = screen.getAllByRole("button", { name: /Strand|Guy's/ });
    fireEvent.click(buttons[0]);
    expect(onSelectCampus).toHaveBeenCalled();
  });
});

// ── LocationChip ──────────────────────────────────────────────────────────────

describe("LocationChip", () => {
  it("renders title, subtitle and clear button", () => {
    const onClear = vi.fn();
    render(<LocationChip dotColor="#f00" title="Strand Campus" subtitle="Strand, London" onClear={onClear} />);
    expect(screen.getByText("Strand Campus")).toBeTruthy();
    expect(screen.getByText("Strand, London")).toBeTruthy();
    expect(screen.getByTitle("Clear")).toBeTruthy();
  });

  it("calls onClear when the clear button is clicked", () => {
    const onClear = vi.fn();
    render(<LocationChip dotColor="#f00" title="Test" subtitle="Sub" onClear={onClear} />);
    fireEvent.click(screen.getByTitle("Clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

// ── CampusQuickNav ────────────────────────────────────────────────────────────

describe("CampusQuickNav", () => {
  it("renders a button for each campus", () => {
    render(<CampusQuickNav onFly={vi.fn()} />);
    expect(screen.getByText("Strand")).toBeTruthy();
    expect(screen.getByText("Guy's")).toBeTruthy();
  });

  it("calls onFly with campus data when button clicked", () => {
    const onFly = vi.fn();
    render(<CampusQuickNav onFly={onFly} />);
    fireEvent.click(screen.getByText("Strand"));
    expect(onFly).toHaveBeenCalledWith(
      expect.objectContaining({ id: "strand", shortName: "Strand" }),
    );
  });
});

// ── CampusMapSidebar ──────────────────────────────────────────────────────────

describe("CampusMapSidebar", () => {
  it("hides the sidebar when showInitialSkeleton is true", () => {
    const props = {
      showInitialSkeleton: true,
      ui: { isMobile: false, mobileInitialOpen: false },
      disruptions: [],
      loadingDisruptions: false,
    };
    const { container } = render(<CampusMapSidebar {...props} />);
    const aside = container.querySelector("div");
    expect(aside.style.visibility).toBe("hidden");
  });

  it("does not hide the sidebar when showInitialSkeleton is false", () => {
    const props = {
      showInitialSkeleton: false,
      ui: { isMobile: false, mobileInitialOpen: false },
      disruptions: [],
      loadingDisruptions: false,
    };
    const { container } = render(<CampusMapSidebar {...props} />);
    const aside = container.querySelector("div");
    expect(aside.style.visibility).not.toBe("hidden");
  });

  it("renders sidebar content", () => {
    const props = {
      showInitialSkeleton: false,
      ui: { isMobile: false, mobileInitialOpen: false },
      disruptions: [],
      loadingDisruptions: false,
    };
    render(<CampusMapSidebar {...props} />);
    expect(screen.getByTestId("sidebar-content")).toBeTruthy();
  });
});
