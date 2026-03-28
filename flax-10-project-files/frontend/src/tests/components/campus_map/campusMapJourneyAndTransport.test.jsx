import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

const geocodeAddressMock = vi.fn();
const walkingCardMock = vi.fn((props) => <div data-testid="walking-card" data-props={JSON.stringify(props)} />);
const tflCardMock = vi.fn((props) => <div data-testid="tfl-card" data-props={JSON.stringify(props)} />);
const sidebarContentMock = vi.fn((props) => <div data-testid="sidebar-content" data-props={JSON.stringify(props)} />);
const asideMock = vi.fn(({ children, ...props }) => <aside data-testid="sidebar" data-props={JSON.stringify(props)}>{children}</aside>);

vi.mock("../../../api/geocodeApi", () => ({
  geocodeAddress: (...args) => geocodeAddressMock(...args),
}));

vi.mock("../../../components/calendar/event_modal/components/LocationAutoComplete", () => ({
  LocationAutocomplete: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/campus_map/components/WalkingRouteCard", () => ({
  WalkingRouteCard: (props) => walkingCardMock(props),
}));

vi.mock("../../../components/campus_map/components/TflRouteCard", () => ({
  TflRouteCard: (props) => tflCardMock(props),
}));

vi.mock("../../../components/campus_map/components/CampusMapSidebarContent", () => ({
  CampusMapSidebarContent: (props) => sidebarContentMock(props),
}));

vi.mock("framer-motion", () => ({
  motion: {
    aside: (props) => asideMock(props),
  },
}));

import { UserJourneySection } from "../../../components/campus_map/components/UserJourneySection";
import { TransportModesSection } from "../../../components/campus_map/components/TransportModesSection";
import { CampusMapSidebar } from "../../../components/campus_map/components/CampusMapSidebar";

function JourneyHarness(props) {
  const [manualStart, setManualStart] = useState(props.initialStart || "");
  const [manualDestination, setManualDestination] = useState(props.initialDestination || "");
  const hProps = {
    onCalculate: vi.fn(), onClearAll: vi.fn(),
    onGeolocateStart: vi.fn(), onGeolocateDestination: vi.fn(),
    ...props, manualStart, setManualStart, manualDestination, setManualDestination
  };
  return <UserJourneySection {...hProps} />;
}

describe("UserJourneySection", () => {
  beforeEach(() => {
    geocodeAddressMock.mockReset();
    geocodeAddressMock.mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
  });

  it("parses coordinate input and enables calculate", async () => {
    const onCalculate = vi.fn();
    render(<JourneyHarness
      initialStart="51.5000, -0.1200" initialDestination="51.5100,-0.1300"
      onCalculate={onCalculate}
    />);
    await waitFor(() => expect(screen.getByRole("button", { name: /calculate route/i })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /calculate route/i }));
    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(onCalculate).toHaveBeenCalledWith(
      { latitude: 51.5, longitude: -0.12 }, { latitude: 51.51, longitude: -0.13 }
    );
  });
  it("clears both fields and calls onClearAll", async () => {
    const onClearAll = vi.fn();
    render(<JourneyHarness initialStart="A" initialDestination="B" onClearAll={onClearAll} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Enter a starting location")).toHaveValue("");
    expect(screen.getByLabelText("Enter a destination")).toHaveValue("");
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("renders the destination geolocate control and invokes it", () => {
    const onGeolocateDestination = vi.fn();

    render(<JourneyHarness onGeolocateDestination={onGeolocateDestination} />);

    expect(screen.getByRole("button", { name: /set start to current location/i })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /set destination to current location/i }));
    expect(onGeolocateDestination).toHaveBeenCalled();
  });

  it("omits the destination geolocate control when the handler is undefined", () => {
    render(
      <UserJourneySection
        manualStart=""
        setManualStart={vi.fn()}
        manualDestination=""
        setManualDestination={vi.fn()}
        onCalculate={vi.fn()}
        onClearAll={vi.fn()}
        onGeolocateStart={vi.fn()}
        onGeolocateDestination={undefined}
        locating={false}
      />
    );

    expect(screen.getByRole("button", { name: /set start to current location/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /set destination to current location/i })).toBeNull();
  });

  it("omits the destination geolocate control when no handler is provided", () => {
    render(<JourneyHarness onGeolocateDestination={null} />);

    expect(screen.getByRole("button", { name: /set start to current location/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /set destination to current location/i })).toBeNull();
  });

  it("cleans up geocode effects when the section unmounts", async () => {
    geocodeAddressMock.mockResolvedValueOnce({ latitude: 51.502, longitude: -0.118 }).mockResolvedValueOnce({ latitude: 51.508, longitude: -0.135 });

    const { unmount } = render(<JourneyHarness initialStart="Bush House" initialDestination="Waterloo" />);
    await waitFor(() => expect(geocodeAddressMock).toHaveBeenCalledTimes(2));

    unmount();
  });

  it("ignores stale geocode results after the input changes", async () => {
    let resolveStart;
    geocodeAddressMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveStart = resolve;
    }));

    render(<JourneyHarness initialStart="Bush House" />);

    await waitFor(() => expect(geocodeAddressMock).toHaveBeenCalledWith("Bush House"));
    fireEvent.change(screen.getByLabelText("Enter a starting location"), { target: { value: "Library" } });

    await act(async () => {
      resolveStart({ latitude: 51.5, longitude: -0.1 });
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: /calculate route/i })).toBeDisabled();
  });

  it("geocodes text input and keeps calculate disabled until both locations resolve", async () => {
    geocodeAddressMock
      .mockResolvedValueOnce({ latitude: 51.502, longitude: -0.118 })
      .mockResolvedValueOnce({ latitude: 51.508, longitude: -0.135 });

    render(<JourneyHarness initialStart="Bush House" initialDestination="Waterloo" />);

    expect(screen.getByRole("button", { name: /calculate route/i })).toBeDisabled();
    await waitFor(() => expect(geocodeAddressMock).toHaveBeenCalledWith("Bush House"));
    await waitFor(() => expect(geocodeAddressMock).toHaveBeenCalledWith("Waterloo"));
    await waitFor(() => expect(screen.getByRole("button", { name: /calculate route/i })).toBeEnabled());
  });

  it("guards the calculate handler when coordinates are still unresolved", () => {
    const onCalculate = vi.fn();
    geocodeAddressMock.mockImplementation(() => new Promise(() => {}));

    render(<JourneyHarness initialStart="Bush House" initialDestination="Waterloo" onCalculate={onCalculate} />);

    const calculateButton = screen.getByRole("button", { name: /calculate route/i });
    expect(calculateButton).toBeDisabled();

    calculateButton.disabled = false;
    calculateButton.removeAttribute("disabled");
    fireEvent.click(calculateButton);

    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("disables geolocation buttons while locating", () => {
    render(<JourneyHarness locating />);

    expect(screen.getByRole("button", { name: /set start to current location/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /set destination to current location/i })).toBeDisabled();
  });
});

describe("TransportModesSection", () => {
  beforeEach(() => {
    walkingCardMock.mockClear();
    tflCardMock.mockClear();
  });

  it("shows the empty state when the journey is incomplete", () => {
    render(<TransportModesSection startLocation={null} selectedCampus={null} customDestination={null} />);

    expect(screen.getByText(/set a starting location and destination/i)).toBeInTheDocument();
    expect(screen.queryByTestId("walking-card")).toBeNull();
  });

  it("shows loading and error states before route cards", () => {
    const { rerender } = render(
      <TransportModesSection
        startLocation={{ lat: 1, lng: 1 }}
        customDestination={{ lat: 2, lng: 2 }}
        loadingRoute
      />
    );
    expect(screen.getByText(/calculating route/i)).toBeInTheDocument();

    rerender(
      <TransportModesSection
        startLocation={{ lat: 1, lng: 1 }}
        customDestination={{ lat: 2, lng: 2 }}
        routeError="No route found"
      />
    );
    expect(screen.getByText("No route found")).toBeInTheDocument();
  });

  it("returns null when endpoints exist but there is no route info yet", () => {
    render(
      <TransportModesSection
        startLocation={{ lat: 1, lng: 1 }}
        customDestination={{ lat: 2, lng: 2 }}
        routeInfo={null}
      />
    );
    expect(screen.getByText(/Transport Modes/i)).toBeInTheDocument();
    expect(screen.queryByTestId("walking-card")).toBeNull();
    expect(screen.queryByTestId("tfl-card")).toBeNull();
  });

  it("passes props through to the route cards", () => {
    render(
      <TransportModesSection
        startLocation={{ lat: 1, lng: 1 }}
        selectedCampus={{ id: "strand" }}
        routeInfo={{ duration: 10 }}
        tflRouteInfo={{ duration: 20, legs: [] }}
        walkingInstructions
        tflInstructions
        loadingTflRoute
        onToggleWalking={vi.fn()}
        onToggleTfl={vi.fn()}
      />
    );

    expect(screen.getByTestId("walking-card")).toBeInTheDocument();
    expect(screen.getByTestId("tfl-card")).toBeInTheDocument();
    expect(walkingCardMock).toHaveBeenCalledWith(expect.objectContaining({ instructionMode: true }));
    expect(tflCardMock).toHaveBeenCalledWith(expect.objectContaining({ instructionMode: true, loading: true }));
  });
});

describe("CampusMapSidebar", () => {
  beforeEach(() => {
    asideMock.mockClear();
    sidebarContentMock.mockClear();
  });

  it("uses desktop animation and hides the sheet while skeleton loads", () => {
    render(
      <CampusMapSidebar
        showInitialSkeleton
        ui={{ isMobile: false, mobileInitialOpen: true }}
        disruptions={[]}
        loadingDisruptions={false}
      />
    );

    const props = JSON.parse(screen.getByTestId("sidebar").dataset.props);
    expect(props.initial).toBe(false);
    expect(props.animate).toEqual({ y: 0 });
    expect(props.drag).toBe(false);
    expect(props.style).toEqual({ visibility: "hidden" });
    expect(sidebarContentMock).toHaveBeenCalled();
  });

  it("uses open animation state for mobile sheets", () => {
    render(<CampusMapSidebar
      showInitialSkeleton={false} ui={{ isMobile: true, mobileInitialOpen: true }}
      disruptions={[]} loadingDisruptions={false}
    />);
    const props = JSON.parse(screen.getByTestId("sidebar").dataset.props);
    expect(props.initial).toBe("open");
    expect(props.animate).toBe("open");
    expect(props.drag).toBe("y");
  });
  it("uses closed animation state for mobile sheets", () => {
    render(<CampusMapSidebar
      showInitialSkeleton={false} ui={{ isMobile: true, mobileInitialOpen: false }}
      disruptions={[]} loadingDisruptions={false}
    />);
    const props = JSON.parse(screen.getByTestId("sidebar").dataset.props);
    expect(props.animate).toBe("closed");
  });
});
