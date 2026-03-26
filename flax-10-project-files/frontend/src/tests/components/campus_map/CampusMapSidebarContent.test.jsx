import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const sidebarHeaderMock = vi.fn((props) => <div data-testid="sidebar-header" data-props={JSON.stringify(props)} />);
const tflStatusMock = vi.fn((props) => <div data-testid="tfl-status" data-props={JSON.stringify(props)} />);
const journeyMock = vi.fn((props) => <div data-testid="journey" data-props={JSON.stringify(props)} />);
const destinationMock = vi.fn((props) => <div data-testid="destination" data-props={JSON.stringify(props)} />);
const transportMock = vi.fn((props) => <div data-testid="transport" data-props={JSON.stringify(props)} />);

vi.mock("../../../components/campus_map/SidebarHeader", () => ({
  SidebarHeader: (props) => sidebarHeaderMock(props),
}));

vi.mock("../../../components/campus_map/TflStatusSection", () => ({
  TflStatusSection: (props) => tflStatusMock(props),
}));

vi.mock("../../../components/campus_map/UserJourneySection", () => ({
  UserJourneySection: (props) => journeyMock(props),
}));

vi.mock("../../../components/campus_map/DestinationSection", () => ({
  DestinationSection: (props) => destinationMock(props),
}));

vi.mock("../../../components/campus_map/TransportModesSection", () => ({
  TransportModesSection: (props) => transportMock(props),
}));

import { CampusMapSidebarContent } from "../../../components/campus_map/CampusMapSidebarContent";

describe("CampusMapSidebarContent", () => {
  const props = {
    disruptions: [{ id: 1 }],
    loadingDisruptions: true,
    form: { manualStart: "A", manualDestination: "B" },
    setManualStart: vi.fn(),
    setManualDestination: vi.fn(),
    handleUserJourneyCalculate: vi.fn(),
    clearAllSelections: vi.fn(),
    handleGeolocateStart: vi.fn(),
    handleGeolocateDestination: vi.fn(),
    ui: { locating: false, walkingInstructions: true, tflInstructions: false },
    selection: { startLocation: { lat: 1, lng: 2 }, selectedCampus: null, customDestination: null },
    handleClearCampus: vi.fn(),
    clearCustomDestination: vi.fn(),
    handleSelectCampus: vi.fn(),
    upcomingEvents: [],
    handleSelectUpcomingEvent: vi.fn(),
    routes: {
      routeInfo: { duration: 10 },
      routeError: "",
      loadingRoute: false,
      tflRouteInfo: { duration: 15, legs: [] },
      tflRouteError: "",
      loadingTflRoute: false,
    },
    toggleWalkingInstructions: vi.fn(),
    toggleTflInstructions: vi.fn(),
  };
  beforeEach(() => vi.clearAllMocks());
  it("renders all sections", () => {
    render(<CampusMapSidebarContent {...props} />);
    ["sidebar-header", "tfl-status", "journey", "destination", "transport"].forEach(id => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });
  it("forwards props to TflStatusSection", () => {
    render(<CampusMapSidebarContent {...props} />);
    expect(tflStatusMock).toHaveBeenCalledWith({
      disruptions: props.disruptions,
      loading: props.loadingDisruptions
    });
  });
  it("forwards props to UserJourneySection", () => {
    render(<CampusMapSidebarContent {...props} />);
    expect(journeyMock).toHaveBeenCalledWith(expect.objectContaining({
      manualStart: "A",
      manualDestination: "B",
      onCalculate: props.handleUserJourneyCalculate,
      onClearAll: props.clearAllSelections,
      onGeolocateStart: props.handleGeolocateStart,
      onGeolocateDestination: props.handleGeolocateDestination,
      locating: props.ui.locating,
    }));
  });
  it("forwards props to DestinationSection", () => {
    render(<CampusMapSidebarContent {...props} />);
    expect(destinationMock).toHaveBeenCalledWith(expect.objectContaining({
      selectedCampus: props.selection.selectedCampus,
      customDestination: props.selection.customDestination,
      onClearCampus: props.handleClearCampus,
      onClearCustomDest: props.clearCustomDestination,
      onSelectCampus: props.handleSelectCampus,
      upcomingEvents: props.upcomingEvents,
      onSelectEvent: props.handleSelectUpcomingEvent,
    }));
  });
  it("forwards props to TransportModesSection", () => {
    render(<CampusMapSidebarContent {...props} />);
    expect(transportMock).toHaveBeenCalledWith(expect.objectContaining({
      startLocation: props.selection.startLocation,
      selectedCampus: props.selection.selectedCampus,
      customDestination: props.selection.customDestination,
      routeInfo: props.routes.routeInfo,
      routeError: props.routes.routeError,
      loadingRoute: props.routes.loadingRoute,
      tflRouteInfo: props.routes.tflRouteInfo,
      tflRouteError: props.routes.tflRouteError,
      loadingTflRoute: props.routes.loadingTflRoute,
      walkingInstructions: props.ui.walkingInstructions,
      tflInstructions: props.ui.tflInstructions,
      onToggleWalking: props.toggleWalkingInstructions,
      onToggleTfl: props.toggleTflInstructions,
    }));
  });
});
