/**
 * Tests for CampusMap page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CampusMap from "../../../pages/CampusMap/CampusMap";
import { reverseGeocode } from "../../../api/geocodeApi";
import { tflService } from "../../../api/tflApi";

const mockMapInstance = {
  on: vi.fn(function (event, cb) {
    if (event === "load") cb();
    return mockMapInstance;
  }),
  addControl: vi.fn(),
  addLayer: vi.fn(),
  addSource: vi.fn(),
  getStyle: vi.fn(() => ({ layers: [] })),
  getSource: vi.fn(() => ({ setData: vi.fn() })),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  remove: vi.fn(),
};

function MockMap() {
  return mockMapInstance;
}

vi.mock("mapbox-gl", () => ({
  default: {
    Map: MockMap,
    NavigationControl: function MockNav() {},
    Marker: vi.fn().mockImplementation(function Marker() {
      const element = document.createElement("button");
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setPopup: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        getElement: vi.fn(() => element),
        getPopup: vi.fn(() => ({ isOpen: vi.fn(() => false), togglePopup: vi.fn() })),
        togglePopup: vi.fn(),
        remove: vi.fn(),
      };
    }),
    Popup: vi.fn().mockImplementation(function Popup() {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        isOpen: vi.fn(() => false),
        togglePopup: vi.fn(),
      };
    }),
    LngLatBounds: vi.fn().mockImplementation(function () { return { extend: vi.fn().mockReturnThis() }; }),
    accessToken: "test-token",
  },
}));

vi.mock("../../../api/tflApi", () => ({
  tflService: {
    getTfLDelays: vi.fn().mockResolvedValue([]),
    journeyPlanner: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("../../../api/geocodeApi", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ latitude: 51.5007, longitude: -0.1246 }),
  reverseGeocode: vi.fn().mockResolvedValue("Westminster, London"),
}));

vi.mock("../../../api/userApi", () => ({
    getHomeAddress: vi.fn().mockResolvedValue({}),
}));

vi.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, ...p }) => (
      <aside {...p}>{children}</aside>
    ),
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
}));

describe("CampusMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({ coords: { latitude: 51.5007, longitude: -0.1246 } });
        }),
      },
    });
    mockMapInstance.on.mockImplementation(function (event, cb) {
      if (event === "load") cb();
      return mockMapInstance;
    });
  });

  it("shows the shared skeleton before the map finishes loading", () => {
    mockMapInstance.on.mockImplementation(function () {
      return mockMapInstance;
    });
    render(<CampusMap />);
    expect(screen.getByTestId("campus-map-skeleton")).toBeInTheDocument();
  });

  it("renders StudyFlax Map title and subtitle", async () => {
    render(<CampusMap />);
    expect(screen.getByText("StudyFlax Map")).toBeInTheDocument();
    expect(screen.getByText("Never be late, plan your journeys!")).toBeInTheDocument();
  });

  it("does not render the removed events today section", () => {
    render(<CampusMap />);
    expect(screen.queryByText("Events Today")).not.toBeInTheDocument();
  });

  it("renders TfL Line Status section", async () => {
    render(<CampusMap />);
    expect(screen.getByText("TfL Line Status")).toBeInTheDocument();
  });

  it("shows Good Service when no disruptions", async () => {
    render(<CampusMap />);
    await waitFor(() => expect(screen.getByText("Good Service!")).toBeInTheDocument());
  });

  it("renders campus list with Strand and Guy's", async () => {
    render(<CampusMap />);
    expect(screen.getAllByText("Strand").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Guy's").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Waterloo").length).toBeGreaterThan(0);
  });

  it("renders Starting Location and Set My Current Location", () => {
    render(<CampusMap />);
    expect(screen.getByText("Starting Location")).toBeInTheDocument();
    expect(screen.getByText("Set My Current Location")).toBeInTheDocument();
  });

  it("selecting a campus shows campus name in chip", async () => {
    render(<CampusMap />);
    await waitFor(() =>
      expect(screen.queryByTestId("campus-map-skeleton")).not.toBeInTheDocument(),
    );
    const strandButtons = await screen.findAllByRole("button", { name: /Strand/ });
    fireEvent.click(strandButtons[0]);
    await waitFor(() => expect(screen.getByText("Strand Campus")).toBeInTheDocument());
  });

  it("shows disruptions when tflService returns disruptions", async () => {
    tflService.getTfLDelays.mockResolvedValueOnce([
      { lineName: "Northern", severityDescription: "Minor", reason: "Engineering", color: "#000" },
    ]);
    render(<CampusMap />);
    expect(await screen.findByText(/Northern/, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("handles TfL disruption fetch error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    tflService.getTfLDelays.mockRejectedValueOnce(new Error("TfL API down"));
    render(<CampusMap />);
    await waitFor(() => expect(tflService.getTfLDelays).toHaveBeenCalled());
    expect(errSpy).toHaveBeenCalledWith("TfL disruption fetch error: ", expect.any(Error));
    errSpy.mockRestore();
  });

  it("sets the destination to the current location when the To location button is clicked", async () => {
    render(<CampusMap />);

    fireEvent.click(screen.getByRole("button", { name: /set destination to current location/i }));

    await waitFor(() => expect(reverseGeocode).toHaveBeenCalledWith(51.5007, -0.1246));
    await waitFor(() => expect(screen.getByPlaceholderText("Enter a destination")).toHaveValue("Westminster, London"));
    expect(screen.getByText("Current location")).toBeInTheDocument();
  });
});
