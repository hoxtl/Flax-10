import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../components/Timer/sound_panel/MusicStations", () => ({
  MusicStations: ({ activeStation, closeStation, toggleStation }) => (
    <div>
      <div>Music & Streams</div>
      <div data-testid="active-station">{activeStation?.id ?? "none"}</div>
      <button type="button" onClick={() => toggleStation({ id: "lofi" })}>
        toggle-lofi
      </button>
      <button type="button" onClick={() => toggleStation({ id: "jazz" })}>
        toggle-jazz
      </button>
      <button type="button" onClick={closeStation}>
        close-station
      </button>
    </div>
  ),
}));

import InlineSoundPanel from "../../../components/Timer/InlineSoundPanel";

describe("InlineSoundPanel", () => {
  it("shows the music widget and toggles stations on and off", () => {
    render(<InlineSoundPanel />);

    expect(screen.getByText("Music & Streams")).toBeInTheDocument();
    expect(screen.getByTestId("active-station")).toHaveTextContent("none");

    fireEvent.click(screen.getByText("toggle-lofi"));
    expect(screen.getByTestId("active-station")).toHaveTextContent("lofi");

    fireEvent.click(screen.getByText("toggle-lofi"));
    expect(screen.getByTestId("active-station")).toHaveTextContent("none");

    fireEvent.click(screen.getByText("toggle-jazz"));
    expect(screen.getByTestId("active-station")).toHaveTextContent("jazz");

    fireEvent.click(screen.getByText("close-station"));
    expect(screen.getByTestId("active-station")).toHaveTextContent("none");
  });
});
