import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationAutocomplete from "../../../../components/common/inputs/LocationAutocomplete";

describe("LocationAutocomplete", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists all suggestions when the value is empty and selects on mousedown", () => {
    const onChange = vi.fn();
    render(<LocationAutocomplete value="" onChange={onChange} placeholder="Where?" />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(5);
    fireEvent.mouseDown(screen.getByText("Strand Campus"));
    expect(onChange).toHaveBeenCalledWith("Strand Campus");
  });

  it("filters suggestions while typing and opens the list on focus", () => {
    const onChange = vi.fn();
    render(<LocationAutocomplete value="Guy" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(screen.getByText("Guy's Campus")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Guy's Tower" } });
    expect(onChange).toHaveBeenCalledWith("Guy's Tower");
    expect(screen.getByText("Guy's Tower")).toBeInTheDocument();
  });

  it("closes the dropdown on outside mousedown", () => {
    render(<LocationAutocomplete value="Strand" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(screen.getByRole("list")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("hides the list when the filter matches nothing", () => {
    render(<LocationAutocomplete value="zzzz-no-match" onChange={vi.fn()} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
