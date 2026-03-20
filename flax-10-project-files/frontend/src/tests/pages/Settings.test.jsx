import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "../../pages/Settings/Settings";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../components/Settings/SettingsUI", () => ({
  SettingsSidebar: ({ activeTab, onChange }) => (
    <div data-testid="settings-tabs">
      <button onClick={() => onChange("account")}>Account</button>
      <button onClick={() => onChange("security")}>Security</button>
      <button onClick={() => onChange("preferences_themes")}>Preferences</button>
      <button onClick={() => onChange("home")}>Home</button>
      <button onClick={() => onChange("preferences_sleep")}>Sleep</button>
      <button onClick={() => onChange("course")}>Course Change</button>
      <span data-testid="active-tab">{activeTab}</span>
    </div>
  ),
  SettingsTabs: ({ activeTab, onChange }) => (
    <div data-testid="settings-tabs">
      <button onClick={() => onChange("account")}>Account</button>
      <button onClick={() => onChange("security")}>Security</button>
      <button onClick={() => onChange("preferences_themes")}>Preferences</button>
      <button onClick={() => onChange("home")}>Home</button>
      <button onClick={() => onChange("preferences_sleep")}>Sleep</button>
      <button onClick={() => onChange("course")}>Course Change</button>
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
  default: ({ activeSubTab }) =>
    activeSubTab === "sleep" ? (
      <div data-testid="sleep-schedule-panel">SleepSchedulePanel</div>
    ) : (
      <div data-testid="preferences-panel">PreferencesPanel</div>
    ),
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

vi.mock("../../components/Settings/CourseChangePanel", () => ({
  default: ({ user }) => (
    <div data-testid="course-change-panel">CourseChangePanel</div>
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
    fireEvent.click(screen.getByText("Preferences"));
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

  it("switches to CourseChangePanel when course tab selected", () => {
    renderSettings(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Course Change"));
    expect(screen.getByTestId("course-change-panel")).toBeTruthy();
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
});
