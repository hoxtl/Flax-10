/**
 * Tests for CampusMap page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CampusMap from "../../../pages/CampusMap/CampusMap";
import { tflService } from "../../../api/tflService";

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
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setPopup: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
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
    LngLatBounds: vi.fn().mockImplementation(function (a, b) { return { extend: vi.fn().mockReturnThis() }; }),
    accessToken: "test-token",
  },
}));

vi.mock("../../../api/tflService", () => ({
  tflService: {
    getTfLDelays: vi.fn().mockResolvedValue([]),
    journeyPlanner: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("../../../api/userService", () => ({
  getHomeAddress: vi.fn().mockResolvedValue({}),
}));

vi.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, initial, animate, drag, dragConstraints, dragElastic, onDragEnd, ...p }) => (
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
    mockMapInstance.on.mockImplementation(function (event, cb) {
      if (event === "load") cb();
      return mockMapInstance;
    });
  });

  it("renders StudyFlax Map title and subtitle", async () => {
    render(<CampusMap />);
    expect(screen.getByText("StudyFlax Map")).toBeInTheDocument();
    expect(screen.getByText("Never be late, plan your journeys!")).toBeInTheDocument();
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
});
