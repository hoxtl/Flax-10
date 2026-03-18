import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "../../pages/Settings/Settings";

vi.mock("../../components/Settings/SettingsUI", () => ({
  SettingsTabs: ({ activeTab, onChange }) => (
    <div data-testid="settings-tabs">
      <button onClick={() => onChange("account")}>Account</button>
      <button onClick={() => onChange("security")}>Security</button>
      <button onClick={() => onChange("preferences")}>Preferences</button>
      <button onClick={() => onChange("home")}>Home</button>
      <button onClick={() => onChange("sleep")}>Sleep</button>
      <button onClick={() => onChange("course")}>Course Change</button>
      <span data-testid="active-tab">{activeTab}</span>
    </div>
  ),
  SuccessBanner: ({ message }) =>
    message ? <div data-testid="success-banner">{message}</div> : null,
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
  default: ({ onSave, isSaving }) => (
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
    successMessage: null,
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

  it("renders Settings title", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(<Settings user={{}} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows AccountForm by default", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("account-form")).toBeTruthy();
  });

  it("switches to SecurityForm when security tab selected", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Security"));
    expect(screen.getByTestId("security-form")).toBeTruthy();
    expect(screen.queryByTestId("account-form")).toBeNull();
  });

  it("switches to PreferencesPanel when preferences tab selected", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Preferences"));
    expect(screen.getByTestId("preferences-panel")).toBeTruthy();
  });

  it("switches to HomeAddressForm when home tab selected", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Home"));
    expect(screen.getByTestId("home-address-form")).toBeTruthy();
  });

  it("switches to SleepSchedulePanel when sleep tab selected", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Sleep"));
    expect(screen.getByTestId("sleep-schedule-panel")).toBeTruthy();
  });

  it("switches to CourseChangePanel when course tab selected", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Course Change"));
    expect(screen.getByTestId("course-change-panel")).toBeTruthy();
  });

  it("renders SuccessBanner when successMessage is set", () => {
    useSettingsHandlers.mockReturnValueOnce({
      isSaving: false,
      passwordError: null,
      homeAddressError: null,
      successMessage: "Saved!",
      handleAccountSave: vi.fn(),
      handlePasswordSave: vi.fn(),
      handlePreferencesSave: vi.fn(),
      handleHomeAddressSave: vi.fn(),
      handleSleepSave: vi.fn(),
    });
    render(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("success-banner")).toBeTruthy();
    expect(screen.getByText("Saved!")).toBeTruthy();
  });

  it("does not render SuccessBanner when no successMessage", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.queryByTestId("success-banner")).toBeNull();
  });

  it("renders SettingsTabs", () => {
    render(<Settings user={{}} onBack={vi.fn()} />);
    expect(screen.getByTestId("settings-tabs")).toBeTruthy();
  });
});
