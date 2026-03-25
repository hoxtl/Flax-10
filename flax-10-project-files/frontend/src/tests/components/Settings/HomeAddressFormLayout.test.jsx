import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../components/Calendar/EventModal/components/LocationAutoComplete", () => ({
  LocationAutocomplete: ({ value, onChange, placeholder }) => (
    <input
      aria-label="Address"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../components/common/InlineAlert/InlineAlert", () => ({
  default: ({ message, variant }) => <div>{variant}:{message}</div>,
}));

vi.mock("../../../components/Settings/SettingsContextCard", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../components/Settings/SettingsUI", () => ({
  SectionHeader: ({ title }) => <div>{title}</div>,
  SubmitButton: ({ label }) => <button type="submit">{label}</button>,
}));

import HomeAddressFormLayout from "../../../components/Settings/HomeAddressFormLayout";

describe("HomeAddressFormLayout", () => {
  it("renders without an inline alert when there is no error", () => {
    render(
      <HomeAddressFormLayout
        onSubmit={vi.fn()}
        homeAddress="1 Strand"
        setHomeAddress={vi.fn()}
        isSaving={false}
        hasUnsaved={false}
        saveSignal={0}
      />,
    );

    expect(screen.queryByText(/warning:/i)).toBeNull();
    expect(screen.getByText("Home Address")).toBeInTheDocument();
  });

  it("suppresses lookup-miss alerts but shows other errors", () => {
    const { rerender } = render(
      <HomeAddressFormLayout
        onSubmit={vi.fn()}
        homeAddress="1 Strand"
        setHomeAddress={vi.fn()}
        error="Address not found in lookup"
        isSaving={false}
        hasUnsaved={false}
        saveSignal={0}
      />,
    );

    expect(screen.queryByText(/warning:/i)).toBeNull();

    rerender(
      <HomeAddressFormLayout
        onSubmit={vi.fn()}
        homeAddress="1 Strand"
        setHomeAddress={vi.fn()}
        error="Something else went wrong"
        isSaving={false}
        hasUnsaved={false}
        saveSignal={0}
      />,
    );

    expect(screen.getByText("warning:Something else went wrong")).toBeInTheDocument();
  });

  it("forwards address changes through the autocomplete field", () => {
    const setHomeAddress = vi.fn();
    render(
      <HomeAddressFormLayout
        onSubmit={vi.fn()}
        homeAddress=""
        setHomeAddress={setHomeAddress}
        isSaving={false}
        hasUnsaved={false}
        saveSignal={0}
      />,
    );

    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "WC2R 2LS" } });
    expect(setHomeAddress).toHaveBeenCalledWith("WC2R 2LS");
  });
});
