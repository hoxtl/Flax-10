/**
 * Covers autocomplete loading, selection, and dismissal behaviour.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import { useLocationAutocomplete } from "../../../../../components/Calendar/event_modal/components/useLocationAutocomplete";

function AutocompleteState({ autocomplete }) {
  return (
    <div>
      <div data-testid="show-state">{String(autocomplete.show)}</div>
      <div data-testid="loading-state">{String(autocomplete.isLoading)}</div>
      <div data-testid="suggestion-count">{autocomplete.suggestions.length}</div>
    </div>
  );
}

function AutocompleteInput({ autocomplete, value }) {
  return (
    <div ref={autocomplete.wrapperRef} data-testid="wrapper">
      <button type="button" onClick={() => autocomplete.handleSelect({ place_name: "King's Building" })}>select-location</button>
      <input aria-label="location-input" value={value} onChange={autocomplete.handleInputChange} onFocus={autocomplete.handleInputFocus} />
    </div>
  );
}

function LocationAutocompleteHarness({ onChangeSpy }) {
  const [value, setValue] = useState("");
  const autocomplete = useLocationAutocomplete(value, (nextValue) => {
    onChangeSpy(nextValue);
    setValue(nextValue);
  });

  return (
    <div>
      <AutocompleteState autocomplete={autocomplete} />
      <AutocompleteInput autocomplete={autocomplete} value={value} />
    </div>
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useLocationAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for user typing before fetching suggestions and stores successful results", async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        features: [{ id: "1", place_name: "Strand Campus, London", text: "Strand Campus" }],
      }),
    });

    render(<LocationAutocompleteHarness onChangeSpy={vi.fn()} />);

    await delay(320);
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("location-input"), { target: { value: "Strand" } });
    expect(screen.getByTestId("show-state")).toHaveTextContent("true");

    await delay(320);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("suggestion-count")).toHaveTextContent("1"));
    expect(screen.getByTestId("loading-state")).toHaveTextContent("false");
  });

  it("keeps short values closed and falls back to an empty suggestion list on fetch errors", async () => {
    fetch.mockRejectedValue(new Error("network"));

    render(<LocationAutocompleteHarness onChangeSpy={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("location-input"), { target: { value: "St" } });
    await delay(320);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId("show-state")).toHaveTextContent("false");

    fireEvent.change(screen.getByLabelText("location-input"), { target: { value: "Strand" } });
    await delay(320);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("loading-state")).toHaveTextContent("false"));
    expect(screen.getByTestId("suggestion-count")).toHaveTextContent("0");
  });

  it("falls back to an empty suggestion array when the API response has no features list", async () => {
    fetch.mockResolvedValue({
      json: async () => ({}),
    });

    render(<LocationAutocompleteHarness onChangeSpy={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("location-input"), { target: { value: "Strand" } });
    await delay(320);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("loading-state")).toHaveTextContent("false"));
    expect(screen.getByTestId("suggestion-count")).toHaveTextContent("0");
  });

  it("prevents immediate reopen after selection", async () => {
    const onChangeSpy = vi.fn();
    render(<LocationAutocompleteHarness onChangeSpy={onChangeSpy} />);
    fireEvent.click(screen.getByText("select-location"));
    expect(onChangeSpy).toHaveBeenCalledWith("King's Building");
    fireEvent.focus(screen.getByLabelText("location-input"));
    expect(screen.getByTestId("show-state")).toHaveTextContent("false");
  });

  it("reopens suggestions after selection cooldown and closes on outside click", async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        features: [{ id: "1", place_name: "Strand Campus, London", text: "Strand Campus" }],
      }),
    });

    render(<LocationAutocompleteHarness onChangeSpy={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("location-input"), { target: { value: "Strand" } });
    await delay(320);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("suggestion-count")).toHaveTextContent("1"));

    fireEvent.click(screen.getByText("select-location"));
    await delay(220);
    fireEvent.focus(screen.getByLabelText("location-input"));
    await waitFor(() => expect(screen.getByTestId("show-state")).toHaveTextContent("true"));
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.getByTestId("show-state")).toHaveTextContent("false"));
  });
});
