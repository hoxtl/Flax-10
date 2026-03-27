import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

<<<<<<< HEAD
vi.mock("../../components/settings/components/AccountForm", () => ({
  default: ({ user }) => <div data-testid="account-form">{user?.first_name || "account"}</div>,
}));

vi.mock("../../components/settings/components/SecurityForm", () => ({
  default: ({ error }) => <div data-testid="security-form">{error || "security"}</div>,
}));

vi.mock("../../components/settings/components/HomeAddressForm", () => ({
  default: ({ error }) => <div data-testid="home-form">{error || "home"}</div>,
}));

vi.mock("../../components/settings/components/PreferencesPanel", () => ({
  default: ({ activeSubTab }) => <div data-testid="preferences-form">{activeSubTab || "preferences"}</div>,
}));

import SettingsPanelContent from "../../pages/settings/components/SettingsPanelContent";
import { PANEL_META, VALID_TABS } from "../../pages/settings/utils/settingsPageConfig";
=======
vi.mock("../../components/settings/AccountForm", () => ({
  default: ({ user }) => <div data-testid="account-form">{user?.first_name || "account"}</div>,
}));

vi.mock("../../components/settings/SecurityForm", () => ({
  default: ({ error }) => <div data-testid="security-form">{error || "security"}</div>,
}));

vi.mock("../../components/settings/HomeAddressForm", () => ({
  default: ({ error }) => <div data-testid="home-form">{error || "home"}</div>,
}));

vi.mock("../../components/settings/PreferencesPanel", () => ({
  default: ({ activeSubTab }) => <div data-testid="preferences-form">{activeSubTab || "preferences"}</div>,
}));

import SettingsPanelContent from "../../pages/settings/SettingsPanelContent";
import { PANEL_META, VALID_TABS } from "../../pages/settings/settingsPageConfig";
>>>>>>> main

describe("SettingsPanelContent", () => {
  const handlers = {
    handleAccountSave: vi.fn(),
    handlePasswordSave: vi.fn(),
    handlePreferencesSave: vi.fn(),
    handleHomeAddressSave: vi.fn(),
    handleSleepSave: vi.fn(),
    handleStudyTimeSave: vi.fn(),
    handleWeekPreferenceSave: vi.fn(),
    handleWorktimePreferenceSave: vi.fn(),
    isSaving: false,
    passwordError: "Bad password",
    homeAddressError: "Bad address",
  };

  it("renders the preferences alias tab with appearance metadata", () => {
    render(<SettingsPanelContent activeTab="preferences" handlers={handlers} user={{ first_name: "Ava" }} />);

    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByText("Customise how StudyFlax looks.")).toBeInTheDocument();
    expect(screen.getByTestId("preferences-form")).toHaveTextContent("themes");
  });

  it("falls back to the account body when the tab id is unknown", () => {
    render(<SettingsPanelContent activeTab="unknown_tab" handlers={handlers} user={{ first_name: "Ava" }} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-form")).toHaveTextContent("Ava");
  });

  it("exports the expected settings tab metadata", () => {
    expect(VALID_TABS.has("account")).toBe(true);
    expect(VALID_TABS.has("preferences_sleep")).toBe(true);
    expect(PANEL_META.preferences_scheduling.title).toBe("Scheduling");
    expect(PANEL_META.home.desc).toContain("journey planning");
  });
});
