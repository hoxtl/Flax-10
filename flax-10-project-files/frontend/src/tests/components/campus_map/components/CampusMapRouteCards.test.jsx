import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../../pages/campus_map/styles/status.module.css", () => ({ default: {} }));
vi.mock("../../../../pages/campus_map/styles/routes.module.css", () => ({ default: {} }));
vi.mock("../../../../pages/campus_map/styles/status.module.css", () => ({ default: {} }));
vi.mock("../../../../pages/campus_map/styles/routes.module.css", () => ({ default: {} }));

vi.mock("../../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children }) => <>{children}</>,
}));

import { TflRouteCard } from "../../../../components/campus_map/components/TflRouteCard";
import { WalkingRouteCard } from "../../../../components/campus_map/components/WalkingRouteCard";

describe("TflRouteCard", () => {
  it("renders loading and error states", () => {
    const { rerender } = render(<TflRouteCard loading={true} />);
    expect(screen.getByText("Checking public transport...")).toBeTruthy();
    rerender(<TflRouteCard loading={false} error="TfL API down" />);
    expect(screen.getByText("TfL API down")).toBeTruthy();
  });

  it("returns null when route data is missing", () => {
    const { container } = render(<TflRouteCard loading={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders route details and toggles instructions", () => {
    const tflRouteInfo = { duration: 25, legs: [{ mode: "tube", routeOptions: [{ name: "Jubilee" }], departurePoint: "A", arrivalPoint: "B", duration: 10 }] };
    const onToggle = vi.fn();
    render(<TflRouteCard loading={false} tflRouteInfo={tflRouteInfo} instructionMode={false} onToggleInstructions={onToggle} />);
    expect(screen.getAllByText("Public Transport")[0]).toBeTruthy();
    fireEvent.click(screen.getByText(/Show step-by-step directions/));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows step-by-step directions when enabled", () => {
    const tflRouteInfo = { duration: 15, legs: [{ mode: "walking", routeOptions: [], departurePoint: "Home", arrivalPoint: "Station", duration: 5 }] };
    render(<TflRouteCard loading={false} tflRouteInfo={tflRouteInfo} instructionMode={true} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("Home → Station")).toBeTruthy();
  });

  it("falls back to an empty leg list when route data omits legs", () => {
    render(
      <TflRouteCard
        loading={false}
        instructionMode={false}
        onToggleInstructions={vi.fn()}
        tflRouteInfo={{ duration: 18 }}
      />
    );

    expect(screen.getAllByText("Public Transport")[0]).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("summarizes a single-line journey", () => {
    const onToggleInstructions = vi.fn();
    render(
      <TflRouteCard loading={false} instructionMode={false} onToggleInstructions={onToggleInstructions}
        tflRouteInfo={{ duration: 12, legs: [{ mode: "tube", lineName: "Jubilee", departurePoint: "A", arrivalPoint: "B", duration: 12 }] }}
      />
    );
    expect(screen.getByText("via Jubilee")).toBeTruthy();
  });

  it("summarizes a two-line journey", () => {
    const onToggleInstructions = vi.fn();
    render(
      <TflRouteCard loading={false} instructionMode={false} onToggleInstructions={onToggleInstructions}
        tflRouteInfo={{ duration: 22, legs: [
          { mode: "tube", routeName: "Jubilee", departurePoint: "A", arrivalPoint: "B", duration: 10 },
          { mode: "tube", lineName: "Northern", departurePoint: "B", arrivalPoint: "C", duration: 12 },
        ] }}
      />
    );
    expect(screen.getByText("via Jubilee & Northern")).toBeTruthy();
  });

  it("summarizes a three-line journey with overflow count", () => {
    const onToggleInstructions = vi.fn();
    render(
      <TflRouteCard loading={false} instructionMode={false} onToggleInstructions={onToggleInstructions}
        tflRouteInfo={{ duration: 35, legs: [
          { mode: "tube", routeName: "Jubilee", departurePoint: "A", arrivalPoint: "B", duration: 10 },
          { mode: "tube", lineName: "Northern", departurePoint: "B", arrivalPoint: "C", duration: 12 },
          { mode: "tube", routeName: "Victoria", departurePoint: "C", arrivalPoint: "D", duration: 13 },
        ] }}
      />
    );
    expect(screen.getByText("via Jubilee, Northern +1 more")).toBeTruthy();
  });
});

describe("WalkingRouteCard", () => {
  const routeInfo = { duration: 600, distance: 800, steps: [{ instruction: "Go", distance: 100, duration: 60 }] };

  it("renders duration, distance and toggles instructions", () => {
    const onToggle = vi.fn();
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={false} onToggleInstructions={onToggle} />);
    expect(screen.getByText("10 mins")).toBeTruthy();
    fireEvent.click(screen.getByText(/Show directions/));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows step list when enabled", () => {
    render(<WalkingRouteCard routeInfo={routeInfo} instructionMode={true} onToggleInstructions={vi.fn()} />);
    expect(screen.getByText("Go")).toBeTruthy();
  });
});
