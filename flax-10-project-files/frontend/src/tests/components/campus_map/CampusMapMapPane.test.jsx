import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const quickNavMock = vi.fn(({ onFly }) => (
  <button type="button" onClick={() => onFly({ id: "strand", name: "Strand", coords: [-0.1, 51.5] })}>
    Quick fly
  </button>
));

vi.mock("../../pages/campus_map/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../pages/campus_map/sidebar.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/CampusMap.module.css", () => ({ default: {} }));
vi.mock("../../../pages/campus_map/sidebar.module.css", () => ({ default: {} }));

vi.mock("../../../components/campus_map/CampusQuickNav", () => ({
  CampusQuickNav: (props) => quickNavMock(props),
}));

import { CampusMapMapPane } from "../../../components/campus_map/CampusMapMapPane";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CampusMapMapPane", () => {
  it("hides the map wrapper during the initial skeleton and forwards the fly handler", () => {
    const flyToCampus = vi.fn();
    const mapContainer = vi.fn();

    const { container, rerender } = render(
      <CampusMapMapPane flyToCampus={flyToCampus} mapContainer={mapContainer} showInitialSkeleton={true} />
    );

    expect(container.firstChild.style.visibility).toBe("hidden");
    expect(mapContainer).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Quick fly"));
    expect(flyToCampus).toHaveBeenCalledWith({ id: "strand", name: "Strand", coords: [-0.1, 51.5] });

    rerender(<CampusMapMapPane flyToCampus={flyToCampus} mapContainer={mapContainer} showInitialSkeleton={false} />);
    expect(container.firstChild.style.visibility).toBe("");
  });
});
