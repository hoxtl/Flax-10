import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "../../pages/Settings/Settings";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../components/Settings/SettingsUI", () => ({
  SettingsSidebar: ({ activeTab, onChange }) => (
    <div data-testid="settings-tabs">
      <button onClick={() => onChange("account")}>Account</button>
      <button onClick={() => onChange("security")}>Security</button>
      <button onClick={() => onChange("preferences_themes")}>Appearance</button>
      <button onClick={() => onChange("home")}>Home</button>
      <button onClick={() => onChange("preferences_sleep")}>Sleep</button>
      <button onClick={() => onChange("preferences_scheduling")}>Scheduling</button>
      <span data-testid="active-tab">{activeTab}</span>
    </div>
  ),
  SettingsTabs: ({ activeTab, onChange }) => (
    <div data-testid="settings-tabs">
      <button onClick={() => onChange("account")}>Account</button>
      <button onClick={() => onChange("security")}>Security</button>
      <button onClick={() => onChange("preferences_themes")}>Appearance</button>
      <button onClick={() => onChange("home")}>Home</button>
      <button onClick={() => onChange("preferences_sleep")}>Sleep</button>
      <button onClick={() => onChange("preferences_scheduling")}>Scheduling</button>
      <span data-testid="active-tab">{activeTab}</span>
    </div>
  ),
  ErrorMessage: ({ message }) =>
    message ? <div data-testid="error-banner">{message}</div> : null,
}));

vi.mock("../../components/Settings/AccountForm", () => ({
  default: ({ onSave, isSaving }) => (
    <div data-testid="account-form">AccountForm</div>
  ),
}));

vi.mock("../../components/Settings/SecurityForm", () => ({
  default: ({ onSave, isSaving, error }) => (
    <div data-testid="security-form">SecurityForm</div>
  ),
}));

vi.mock("../../components/Settings/PreferencesPanel", () => ({
  default: ({ activeSubTab }) => {
    const labels = {
      sleep: "sleep-schedule-panel",
      scheduling: "scheduling-panel",
      studytime: "study-time-panel",
      week: "week-preference-panel",
      daynight: "worktime-preference-panel",
    };

    return activeSubTab && labels[activeSubTab] ? (
      <div data-testid={labels[activeSubTab]}>{activeSubTab}</div>
    ) : (
      <div data-testid="preferences-panel">PreferencesPanel</div>
    );
  },
}));

vi.mock("../../components/Settings/HomeAddressForm", () => ({
  default: ({ onSave, isSaving, error }) => (
    <div data-testid="home-address-form">HomeAddressForm</div>
  ),
}));

vi.mock("../../components/Settings/SleepSchedulePanel", () => ({
  SleepSchedulePanel: ({ onSave, isSaving }) => (
    <div data-testid="sleep-schedule-panel">SleepSchedulePanel</div>
  ),
}));

vi.mock("../../components/Settings/hooks/useSettingsHandlers", () => ({
  default: vi.fn(() => ({
    isSaving: false,
    passwordError: null,
    homeAddressError: null,
    bannerMessage: null,
    handleAccountSave: vi.fn(),
    handlePasswordSave: vi.fn(),
    handlePreferencesSave: vi.fn(),
    handleHomeAddressSave: vi.fn(),
    handleSleepSave: vi.fn(),
    handleStudyTimeSave: vi.fn(),
    handleWeekPreferenceSave: vi.fn(),
    handleWorktimePreferenceSave: vi.fn(),
  })),
}));

import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSettings = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

  it("renders Settings title", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("shows AccountForm by default", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("account-form")).toBeTruthy();
  });

  it("switches to SecurityForm when security tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Security"));
    expect(screen.getByTestId("security-form")).toBeTruthy();
    expect(screen.queryByTestId("account-form")).toBeNull();
  });

  it("switches to PreferencesPanel when preferences tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Appearance"));
    expect(screen.getByTestId("preferences-panel")).toBeTruthy();
  });

  it("switches to HomeAddressForm when home tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Home"));
    expect(screen.getByTestId("home-address-form")).toBeTruthy();
  });

  it("switches to SleepSchedulePanel when sleep tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Sleep"));
    expect(screen.getByTestId("sleep-schedule-panel")).toBeTruthy();
  });

  it("renders error banner when bannerMessage is set", () => {
    useSettingsHandlers.mockReturnValueOnce({
      isSaving: false,
      passwordError: null,
      homeAddressError: null,
      bannerMessage: "Failed to save preferences",
      handleAccountSave: vi.fn(),
      handlePasswordSave: vi.fn(),
      handlePreferencesSave: vi.fn(),
      handleHomeAddressSave: vi.fn(),
      handleSleepSave: vi.fn(),
      handleStudyTimeSave: vi.fn(),
      handleWeekPreferenceSave: vi.fn(),
      handleWorktimePreferenceSave: vi.fn(),
    });
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("error-banner")).toBeTruthy();
    expect(screen.getByText("Failed to save preferences")).toBeTruthy();
  });

  it("does not render error banner when no bannerMessage", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.queryByTestId("error-banner")).toBeNull();
  });

  it("renders SettingsTabs", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("settings-tabs")).toBeTruthy();
  });

  it("switches to combined scheduling panel when scheduling tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Scheduling"));
    expect(screen.getByTestId("scheduling-panel")).toBeTruthy();
  });

  it("legacy scheduling tab ids still route to scheduling panel", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Scheduling"));
    expect(screen.getByTestId("scheduling-panel")).toBeTruthy();
  });
});
