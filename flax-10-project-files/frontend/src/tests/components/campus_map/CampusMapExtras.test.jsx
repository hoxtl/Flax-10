import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../pages/CampusMap/Sidebar.module.css", () => ({ default: {} }));
vi.mock("../../pages/CampusMap/status.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/Sidebar.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/status.module.css", () => ({ default: {} }));

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => ({ children, ...props }) => <div {...props}>{children}</div> }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/campus_map/CampusMapSidebarContent", () => ({
  CampusMapSidebarContent: () => <div data-testid="sidebar-content" />,
}));

vi.mock("../../../lib/kclCampuses", () => ({
  KCL_CAMPUSES: [
    { id: "strand", name: "Strand Campus", shortName: "Strand", coords: [-0.1, 51.5], address: "Strand", color: "#e63f3f" },
  ],
}));

import { TflStatusSection } from "../../../components/campus_map/TflStatusSection";
import { TransportModesSection } from "../../../components/campus_map/TransportModesSection";
import { DestinationSection } from "../../../components/campus_map/DestinationSection";
import { LocationChip } from "../../../components/campus_map/LocationChip";
import { CampusQuickNav } from "../../../components/campus_map/CampusQuickNav";
import { CampusMapSidebar } from "../../../components/campus_map/CampusMapSidebar";

describe("TflStatusSection", () => {
  it("renders loading and good service states", () => {
    const { rerender } = render(<TflStatusSection disruptions={[]} loading={true} />);
    expect(screen.getByText(/Checking TfL Line status/)).toBeTruthy();
    rerender(<TflStatusSection disruptions={[]} loading={false} />);
    expect(screen.getByText("Good Service!")).toBeTruthy();
  });

  it("renders and expands disruptions lists with last-updated text", () => {
    const d = [{ lineName: "A", severityDescription: "Minor", reason: "R", color: "#000" }, { lineName: "B", severityDescription: "S", reason: "R" }, { lineName: "C", severityDescription: "M", reason: "R" }];
    render(<TflStatusSection disruptions={d} loading={false} />);
    expect(screen.getByText(/Last Updated:/)).toBeTruthy();
    expect(screen.queryByText(/- C/)).toBeNull();
    expect(screen.getByRole("button", { name: /Show 1 More/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Show 1 More/i }));
    expect(screen.getByText(/Show Less/)).toBeTruthy();
    expect(screen.getByText(/- C/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Show Less/i }));
    expect(screen.getByRole("button", { name: /Show 1 More/i })).toBeTruthy();
  });
});

describe("DestinationSection & LocationChip", () => {
  const base = { selectedCampus: null, customDestination: null, onClearCampus: vi.fn(), onClearCustomDest: vi.fn(), onSelectCampus: vi.fn() };
  it("renders hint and campus chip", () => {
    const { rerender } = render(<DestinationSection {...base} />);
    expect(screen.getByText(/Select a campus or event/)).toBeTruthy();
    rerender(<DestinationSection {...base} selectedCampus={{ name: "Strand" }} />);
    expect(screen.getAllByText("Strand").length).toBeGreaterThan(0);
  });

  it("marks the selected campus button as active", () => {
    const { rerender } = render(<DestinationSection {...base} />);
    const inactiveClassName = screen.getByRole("button", { name: /Strand/i }).className;

    rerender(
      <DestinationSection
        {...base}
        selectedCampus={{ id: "strand", name: "Strand Campus", address: "Strand", color: "#e63f3f" }}
      />
    );

    const activeClassName = screen.getByRole("button", { name: /Strand/i }).className;
    expect(activeClassName).not.toBe(inactiveClassName);
  });

  it("renders custom destinations and upcoming events with fallback labels", () => {
    const onSelectEvent = vi.fn();
    const onClearCustomDest = vi.fn();
    render(
      <DestinationSection
        {...base}
        customDestination={{ name: "Library", address: "1 King’s Way" }}
        upcomingEvents={[
          { title: "Open Day", location: "Bush House", start_time: "2026-03-26T10:15:00Z" },
          { location: "Unknown Hall", start_time: "", title: "" },
        ]}
        onClearCustomDest={onClearCustomDest}
        onSelectEvent={onSelectEvent}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Open Day/i }));
    fireEvent.click(screen.getByRole("button", { name: /Upcoming event/i }));
    fireEvent.click(screen.getByTitle("Clear"));
    expect(onSelectEvent).toHaveBeenCalledTimes(2);
    expect(onClearCustomDest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("1 King’s Way")).toBeTruthy();
  });

  it("uses stable event ids when rendering upcoming events", () => {
    render(
      <DestinationSection
        {...base}
        upcomingEvents={[{ id: "event-1", title: "Open Day", location: "Bush House", start_time: "2026-03-26T10:15:00Z" }]}
      />
    );

    expect(screen.getByRole("button", { name: /Open Day/i })).toBeTruthy();
  });

  it("does not require an onSelectEvent handler", () => {
    render(
      <DestinationSection
        {...base}
        upcomingEvents={[{ title: "Open Day", location: "Bush House", start_time: "2026-03-26T10:15:00Z" }]}
        onSelectEvent={undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Open Day/i }));
    expect(screen.getByRole("button", { name: /Open Day/i })).toBeTruthy();
  });

  it("LocationChip triggers clear", () => {
    const onClear = vi.fn();
    render(<LocationChip title="T" subtitle="S" onClear={onClear} />);
    fireEvent.click(screen.getByTitle("Clear"));
    expect(onClear).toHaveBeenCalled();
  });
});

describe("CampusQuickNav & Sidebar", () => {
  it("QuickNav triggers fly", () => {
    const onFly = vi.fn();
    render(<CampusQuickNav onFly={onFly} />);
    fireEvent.click(screen.getByText("Strand"));
    expect(onFly).toHaveBeenCalled();
  });

  it("Sidebar visibility based on skeleton", () => {
    const props = { showInitialSkeleton: true, ui: { isMobile: false }, disruptions: [], loadingDisruptions: false };
    const { container, rerender } = render(<CampusMapSidebar {...props} />);
    expect(container.querySelector("div").style.visibility).toBe("hidden");
    rerender(<CampusMapSidebar {...props} showInitialSkeleton={false} />);
    expect(container.querySelector("div").style.visibility).not.toBe("hidden");
  });
});
