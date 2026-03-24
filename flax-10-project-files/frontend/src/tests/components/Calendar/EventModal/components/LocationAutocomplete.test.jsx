import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const autocompleteState = {
  handleInputChange: vi.fn(),
  handleInputFocus: vi.fn(),
  handleSelect: vi.fn(),
  isLoading: false,
  show: false,
  suggestions: [],
  wrapperRef: { current: null },
};

vi.mock("../../../../../components/Calendar/EventModal/components/useLocationAutocomplete", () => ({
  useLocationAutocomplete: () => autocompleteState,
}));

import { LocationAutocomplete } from "../../../../../components/Calendar/EventModal/components/LocationAutoComplete";

describe("LocationAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autocompleteState.handleInputChange = vi.fn();
    autocompleteState.handleInputFocus = vi.fn();
    autocompleteState.handleSelect = vi.fn();
    autocompleteState.isLoading = false;
    autocompleteState.show = false;
    autocompleteState.suggestions = [];
    autocompleteState.wrapperRef = { current: null };
  });

  it("wires the input handlers and placeholder", () => {
    render(<LocationAutocomplete value="Strand" onChange={vi.fn()} placeholder="Search a place" />);

    const input = screen.getByPlaceholderText("Search a place");
    fireEvent.change(input, { target: { value: "Guy's" } });
    fireEvent.focus(input);

    expect(autocompleteState.handleInputChange).toHaveBeenCalled();
    expect(autocompleteState.handleInputFocus).toHaveBeenCalled();
  });

  it("renders loading, empty, and suggestion states", () => {
    const { rerender } = render(<LocationAutocomplete value="St" onChange={vi.fn()} />);
    expect(screen.queryByText("No locations found. You can still save this manually.")).not.toBeInTheDocument();

    autocompleteState.show = true;
    autocompleteState.isLoading = true;
    rerender(<LocationAutocomplete value="Strand" onChange={vi.fn()} />);
    expect(document.querySelector('[class*="loadingIndicator"]')).toBeTruthy();

    autocompleteState.isLoading = false;
    autocompleteState.suggestions = [];
    rerender(<LocationAutocomplete value="Strand" onChange={vi.fn()} />);
    expect(screen.getByText("No locations found. You can still save this manually.")).toBeInTheDocument();

    autocompleteState.suggestions = [
      { id: "1", place_name: "Strand Campus, London", text: "Strand Campus" },
    ];
    rerender(<LocationAutocomplete value="Strand" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByText("Strand Campus"));
    expect(autocompleteState.handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ place_name: "Strand Campus, London" }),
    );
  });
});
