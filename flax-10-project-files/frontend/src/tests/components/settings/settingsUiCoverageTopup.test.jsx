import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../components/common/inline_alert/InlineAlert", () => ({
  default: ({ message, variant }) => (message ? <div>{variant}:{message}</div> : null),
}));

vi.mock("../../../components/common/text_input/TextInput", () => ({
  default: (props) => <input {...props} />,
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/hooks/useTransientSavedState", () => ({
  useTransientSavedState: vi.fn(() => false),
}));

vi.mock("../../../context/ThemeConstants", () => ({
  THEME_GROUPS: [
    {
      label: "Classics",
      themes: [
        {
          id: "flax",
          name: "Flax",
          light: { bg: "#fff", border: "#ddd", text: "#111", primary: "#111", highlight: "#222", card: "#333", sidebar: "#444" },
          dark: { bg: "#000", border: "#111", text: "#fff", primary: "#aaa", highlight: "#bbb", card: "#ccc", sidebar: "#ddd" },
        },
        {
          id: "ocean",
          name: "Ocean",
          light: { bg: "#eef", border: "#aac", text: "#113", primary: "#08c", highlight: "#4cf", card: "#ddf", sidebar: "#bbf" },
          dark: { bg: "#013", border: "#135", text: "#eef", primary: "#39c", highlight: "#6ef", card: "#024", sidebar: "#046" },
        },
      ],
    },
  ],
}));

vi.mock("lucide-react", () => ({
  Clock3: () => <svg data-testid="icon-clock" />,
  Lock: () => <svg data-testid="icon-lock" />,
  MapPin: () => <svg data-testid="icon-map" />,
  Moon: () => <svg data-testid="icon-moon" />,
  Paintbrush: () => <svg data-testid="icon-paint" />,
  User: () => <svg data-testid="icon-user" />,
}));

import RequestDecisionNotice from "../../../components/settings/ui/RequestDecisionNotice";
import SectionHeader from "../../../components/settings/ui/SectionHeader";
import SubmitButton from "../../../components/settings/ui/SubmitButton";
import { FormInput } from "../../../components/settings/ui/FormControls";
import { SettingsTabs, TabButton } from "../../../components/settings/ui/SettingsSidebar";
import { ThemeGridSelector, ThemeSelector } from "../../../components/settings/ui/ThemeSelectors";

describe("settings ui coverage topups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the request notice copy", () => {
    render(<RequestDecisionNotice />);
    expect(screen.getByText(/accepted or rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/you'll be notified once a decision is made/i)).toBeInTheDocument();
  });

  it("renders optional section descriptions", () => {
    render(<SectionHeader title="Appearance" description="Choose a theme mode." />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Choose a theme mode.")).toBeInTheDocument();
  });

  it("renders plain form inputs without a remaining counter when maxLength is omitted", () => {
    render(<FormInput id="bio" label="Bio" value="hello" onChange={vi.fn()} />);
    const input = screen.getByLabelText("Bio");
    expect(input).toHaveAttribute("name", "bio");
    expect(screen.queryByText(/characters remaining/i)).toBeNull();
  });

  it("shows the base submit label when not saving and not in a saved state", () => {
    render(
      <SubmitButton
        isSaving={false}
        label="Save now"
        savingLabel="Saving..."
        hasUnsaved={false}
        saveSignal={0}
      />,
    );

    expect(screen.getByRole("button", { name: "Save now" })).toBeInTheDocument();
  });

  it("shows saving labels and unsaved styling when appropriate", () => {
    const { rerender } = render(
      <SubmitButton
        isSaving={false}
        label="Save"
        savingLabel="Saving..."
        hasUnsaved
      />,
    );

    expect(screen.getByRole("button", { name: "Save" }).className).toContain("btnPrimaryNeedsSave");

    rerender(
      <SubmitButton
        isSaving
        label="Save"
        savingLabel="Saving..."
        hasUnsaved={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("renders theme mode options and theme cards, and forwards selections", () => {
    const onChange = vi.fn();

    render(
      <>
        <ThemeSelector value="light" onChange={onChange} />
        <ThemeGridSelector value="flax" onChange={onChange} />
      </>,
    );

    expect(screen.getAllByText("Light")).toHaveLength(3);
    expect(screen.getAllByText("Dark")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: /dark/i }));
    fireEvent.click(screen.getByText("Ocean"));

    expect(onChange).toHaveBeenCalledWith("dark");
    expect(onChange).toHaveBeenCalledWith("ocean");
  });

  it("renders settings tabs and standalone tab buttons", () => {
    const onChange = vi.fn();

    render(
      <>
        <SettingsTabs activeTab="security" onChange={onChange} />
        <TabButton id="custom" label="Custom" isActive={false} onClick={onChange} />
      </>,
    );

    expect(screen.getByText("My Details")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Security" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByRole("button", { name: "Location" }));
    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    expect(onChange).toHaveBeenCalledWith("home");
    expect(onChange).toHaveBeenCalledWith("custom");
  });

  it("uses default submit-button props and active tab-button styling", () => {
    const onClick = vi.fn();
    render(
      <>
        <SubmitButton isSaving={false} label="Default save" savingLabel="Saving..." />
        <TabButton id="active" label="Active tab" isActive onClick={onClick} />
      </>,
    );

    expect(screen.getByRole("button", { name: "Default save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active tab" }).className).toContain("navItemActive");
  });
});
