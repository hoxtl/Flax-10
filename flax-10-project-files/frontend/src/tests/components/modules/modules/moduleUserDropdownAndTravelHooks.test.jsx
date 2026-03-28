import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import UserModuleDropdown from "../../../../components/modules/components/UserModuleDropdown";
import TravelTimeIndicator from "../../../../components/modules/modules/TravelTimeIndicator";
import { useModuleTravelTime } from "../../../../components/modules/modules/useModuleTravelTime";
import { useModuleCourseFilterState } from "../../../../components/modules/modules/useModuleCourseFilterState";

const useModulesMock = vi.fn();
const getHomeAddressMock = vi.fn();
const getTravelTimeModuleMock = vi.fn();

vi.mock("../../../../components/modules/hooks/useModules", () => ({
  default: function useModules() {
    return useModulesMock();
  },
}));

vi.mock("../../../../components/common/animated_dropdown/AnimatedDropdown", () => ({
  default: ({ options, placeholder, onChange, value, className, triggerClassName }) => (
    <div>
      <div data-testid="placeholder">{placeholder}</div>
      <div data-testid="className">{className || ""}</div>
      <div data-testid="triggerClassName">{triggerClassName || ""}</div>
      <div>{options.map((option) => option.label).join("|")}</div>
      <button onClick={() => onChange?.("CS101")}>{value || "change"}</button>
    </div>
  ),
}));

vi.mock("../../../../api/userApi.js", () => ({
  getHomeAddress: (...args) => getHomeAddressMock(...args),
}));

vi.mock("../../../../utils/tflTravelTime.js", () => ({
  getTravelTimeModule: (...args) => getTravelTimeModuleMock(...args),
}));

function TravelHarness({ location }) {
  const travelTime = useModuleTravelTime(location);
  const state = useModuleCourseFilterState();
  return (
    <div>
      <div data-testid="travel">{String(travelTime)}</div>
      <div data-testid="open">{String(state.isOpen)}</div>
      <div data-testid="query">{state.filterQuery}</div>
      <div data-testid="expanded">{JSON.stringify(state.expanded)}</div>
      <button onClick={() => state.setIsOpen(true)}>open</button>
      <button onClick={() => state.setFilterQuery("cs")}>query</button>
      <button onClick={() => state.toggleExpanded("group")}>expand</button>
    </div>
  );
}

describe("Module extras", () => {
  it("renders user module dropdown states", () => {
    const onChange = vi.fn();
    useModulesMock.mockReturnValueOnce({
      enrollments: [{ module_code: "CS101", module_name: "Algorithms" }, { module: { module_code: "MA202", module_name: "Maths" } }],
      loading: false,
    });

    render(<UserModuleDropdown value="" onChange={onChange} />);
    expect(screen.getByText("CS101 — Algorithms|MA202 — Maths")).toBeInTheDocument();
    fireEvent.click(screen.getByText("change"));
    expect(onChange).toHaveBeenCalledWith("CS101");

    useModulesMock.mockReturnValueOnce({ enrollments: null, loading: true });
    render(<UserModuleDropdown value="" onChange={onChange} />);
    expect(screen.getByText("Loading modules...")).toBeInTheDocument();
  });

  it("supports none option, custom placeholder, and label fallbacks", () => {
    const onChange = vi.fn();
    useModulesMock.mockReturnValueOnce({
      enrollments: [
        { module_code: "CS101" },
        { module_name: "History of Art" },
      ],
      loading: false,
    });

    render(
      <UserModuleDropdown
        value=""
        onChange={onChange}
        allowNone={true}
        placeholder="Pick one"
        className="outer-shell"
        triggerClassName="trigger-shell"
      />,
    );

    expect(screen.getByText("None|CS101|History of Art")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder")).toHaveTextContent("Pick one");
    expect(screen.getByTestId("className")).toHaveTextContent("outer-shell");
    expect(screen.getByTestId("triggerClassName")).toHaveTextContent("trigger-shell");
  });

  it("renders travel time indicator and travel/filter hooks", async () => {
    getHomeAddressMock.mockResolvedValue("London");
    getTravelTimeModuleMock.mockResolvedValue({ duration: 24 });

    render(
      <>
        <TravelTimeIndicator duration={18} />
        <TravelHarness location="Strand Campus" />
      </>
    );

    expect(screen.getByText("18 min via TfL")).toBeInTheDocument();
    expect(screen.getByText("Travel time from home")).toBeInTheDocument();
    expect(await screen.findByTestId("travel")).toHaveTextContent("24");
    fireEvent.click(screen.getByText("open"));
    fireEvent.click(screen.getByText("query"));
    fireEvent.click(screen.getByText("expand"));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
    expect(screen.getByTestId("query")).toHaveTextContent("cs");
    expect(screen.getByTestId("expanded")).toHaveTextContent('"group":true');
  });

  it("falls back cleanly when travel loading fails or location is missing", async () => {
    getHomeAddressMock.mockRejectedValueOnce(new Error("no home"));

    const { rerender } = render(<TravelHarness location="Guy's Campus" />);
    expect(await screen.findByTestId("travel")).toHaveTextContent("null");
    const callCountBeforeRerender = getHomeAddressMock.mock.calls.length;

    rerender(<TravelHarness location={null} />);
    expect(getHomeAddressMock.mock.calls.length).toBe(callCountBeforeRerender);
  });
});
