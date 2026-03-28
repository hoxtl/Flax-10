import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUserSettings = vi.fn();
const saveHomeAddress = vi.fn();
const geocodeAddress = vi.fn();
const patchSettings = vi.fn();
const hasToken = vi.fn();
const saveUserToStorage = vi.fn();
const clearAuthAndRedirect = vi.fn();
const cancelCourseChangeRequest = vi.fn();
const getMyCourseChangeRequest = vi.fn();

vi.mock("../../../../api/userApi", () => ({
  updateUserSettings: (...args) => updateUserSettings(...args),
  saveHomeAddress: (...args) => saveHomeAddress(...args),
}));

vi.mock("../../../../api/geocodeApi", () => ({
  geocodeAddress: (...args) => geocodeAddress(...args),
}));

vi.mock("../../../../api/settingsApi", () => ({
  patchSettings: (...args) => patchSettings(...args),
  hasToken: (...args) => hasToken(...args),
  saveUserToStorage: (...args) => saveUserToStorage(...args),
  clearAuthAndRedirect: (...args) => clearAuthAndRedirect(...args),
}));

vi.mock("../../../../api/adminApi", () => ({
  cancelCourseChangeRequest: (...args) => cancelCourseChangeRequest(...args),
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequest(...args),
}));

vi.mock("../../../../components/common/inline_alert/InlineAlert", () => ({
  default: ({ message, variant }) => message ? <div>{variant}:{message}</div> : null,
}));

vi.mock("../../../../components/common/text_input/TextInput", () => ({
  default: (props) => <input {...props} />,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/hooks/useTransientSavedState", () => ({
  useTransientSavedState: vi.fn((signal) => signal > 0),
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ onChange, placeholder, searchable, usePortal }) => (
    <button type="button" data-searchable={String(searchable)} data-portal={String(usePortal)} onClick={() => onChange("dark")}>
      {placeholder}
    </button>
  ),
}));

vi.mock("../../../../context/ThemeConstants", () => ({
  THEME_GROUPS: [
    {
      label: "Classic",
      themes: [
        {
          id: "flax",
          name: "Flax",
          light: { bg: "#fff", border: "#ddd", text: "#111", primary: "#111", highlight: "#222", card: "#333", sidebar: "#444" },
          dark: { bg: "#000", border: "#111", text: "#fff", primary: "#aaa", highlight: "#bbb", card: "#ccc", sidebar: "#ddd" },
        },
      ],
    },
  ],
}));

import {
  ErrorMessage,
  FormInput,
  FormSelect,
  SectionHeader,
  SettingsSidebar,
  SubmitButton,
  SuccessBanner,
  TabButton,
  ThemeGridSelector,
} from "../../../../components/settings/components/SettingsUI";
import {
  clearCachedPendingRequest,
  getCachedPendingRequest,
  normaliseCourseRequest,
  setCachedPendingRequest,
} from "../../../../components/settings/account/accountCourseRequests";
import {
  createCancelCourseRequestHandler,
  createCourseRequestSuccessHandler,
} from "../../../../components/settings/account/useCourseRequestActions";
import {
  saveAccount,
  saveAddress,
  savePassword,
  savePreferences,
  saveSleep,
  saveSleepWindow,
  saveStudyTime,
  saveWeekPreference,
  saveWorktimePreference,
  showTemporaryMessage,
} from "../../../../components/settings/hooks/settingsHandlerHelpers";
import { getSleepDuration, getSleepMinutes, getSleepQuality } from "../../../../components/settings/preferences/sleepUtils";

const renderSettingsUiShowcase = () => {
  const onChange = vi.fn();
  render(
    <>
      <SuccessBanner message="Saved!" />
      <ErrorMessage message="Oops" />
      <SectionHeader title="Account" />
      <FormInput id="bio" label="Bio" value="hello" onChange={vi.fn()} maxLength={10} />
      <FormSelect id="theme" label="Theme" value="light" onChange={onChange} options={[{ value: "light", label: "Light" }]} grouped />
      <SubmitButton isSaving={false} label="Save" savingLabel="Saving..." hasUnsaved saveSignal={1} />
      <TabButton id="x" label="Go" isActive onClick={onChange} />
      <ThemeGridSelector value="flax" onChange={onChange} />
      <SettingsSidebar activeTab="account" onChange={onChange} user={{ first_name: "Ava" }} />
    </>,
  );
  return { onChange };
};

const buildSaveActions = () => ({
  setPasswordError: vi.fn(),
  setBannerMessage: vi.fn(),
  setIsSaving: vi.fn(),
  setHomeAddressError: vi.fn(),
});

const buildCourseContext = () => ({
  refreshProfile: vi.fn(),
  setCancellingRequest: vi.fn(),
  setCourseRequestNotice: vi.fn(),
  setCourseRequestError: vi.fn(),
  setPendingRequest: vi.fn(),
  setShowModal: vi.fn(),
});

describe("settings leaf extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("covers small settings UI components (banners, headers, inputs)", () => {
    const onChange = vi.fn();
    render(
      <>
        <SuccessBanner message="Saved!" />
        <ErrorMessage message="Oops" />
        <SectionHeader title="Account" />
        <FormInput id="bio" label="Bio" value="hello" onChange={vi.fn()} maxLength={10} />
        <SubmitButton isSaving={false} label="Save" savingLabel="Saving..." hasUnsaved saveSignal={1} />
      </>,
    );
    expect(screen.getByText("success:Saved!")).toBeInTheDocument();
    expect(screen.getByText("error:Oops")).toBeInTheDocument();
    expect(screen.getByText("(5 characters remaining)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✓ Saved!" })).toBeInTheDocument();
  });

  it("covers sidebar and selector states", () => {
    const onChange = vi.fn();
    render(
      <>
        <FormSelect id="theme" label="T" value="l" onChange={onChange} options={[]} grouped />
        <ThemeGridSelector value="flax" onChange={onChange} />
        <SettingsSidebar activeTab="account" onChange={onChange} user={{ first_name: "Ava" }} />
      </>,
    );
    fireEvent.click(screen.getByText("Select"));
    expect(onChange).toHaveBeenCalledWith({ target: { name: "theme", value: "dark" } });
    fireEvent.click(screen.getByText("Flax"));
    expect(onChange).toHaveBeenCalledWith("flax");
    fireEvent.click(screen.getByText("Appearance"));
    expect(onChange).toHaveBeenCalledWith("preferences_themes");
  });

  it("hides profile completion when user details are complete", () => {
    render(
      <SettingsSidebar
        activeTab="account"
        onChange={vi.fn()}
        user={{ first_name: "A", last_name: "B", email: "a@b.com", major: "Maths", year: "Year 2" }}
      />,
    );
    expect(screen.queryByText("Profile")).toBeNull();
  });

  it("covers account request cache normalisation edge cases", () => {
    expect(normaliseCourseRequest("bad-data")).toBeNull();
    expect(normaliseCourseRequest([{ status: "approved" }, { request_status: "pending", new_course: "Physics" }]).requested_course).toBe("Physics");
    setCachedPendingRequest("History");
    expect(getCachedPendingRequest()).toEqual({ status: "pending", requested_course: "History" });
    clearCachedPendingRequest();
    expect(getCachedPendingRequest()).toBeNull();
  });

  describe("course request actions", () => {
    it("loads pending requests after cancelling", async () => {
      const context = buildCourseContext();
      cancelCourseChangeRequest.mockResolvedValueOnce({});
      getMyCourseChangeRequest.mockResolvedValueOnce({ status: "pending", requested_course: "Physics" });
      await createCancelCourseRequestHandler(context)();
      expect(context.setPendingRequest).toHaveBeenCalledWith(expect.objectContaining({ requested_course: "Physics" }));
    });

    it("notifies when cancel has nothing to remove", async () => {
      const context = buildCourseContext();
      cancelCourseChangeRequest.mockRejectedValueOnce(new Error("No pending request to cancel"));
      await createCancelCourseRequestHandler(context)();
      expect(context.setCourseRequestNotice).toHaveBeenCalledWith("Request cancelled.");
    });

    it("marks success responses as pending", () => {
      const context = buildCourseContext();
      createCourseRequestSuccessHandler(context)({ requestedCourse: "Chemistry" }, "Chemistry");
      expect(context.setPendingRequest).toHaveBeenCalledWith(expect.objectContaining({ requested_course: "Chemistry" }));
      expect(context.setShowModal).toHaveBeenCalledWith(false);
    });
  });

  describe("save helpers", () => {
    it("requires auth and handles failed account saves", async () => {
      const actions = buildSaveActions();
      hasToken.mockReturnValue(false);
      await expect(saveAccount({ firstName: "A" }, actions)).resolves.toBe(false);
      expect(actions.setPasswordError).toHaveBeenCalled();
      hasToken.mockReturnValue(true);
      patchSettings.mockResolvedValueOnce({ ok: false, data: { error: "bad save" } });
      await expect(saveAccount({ firstName: "A" }, actions)).resolves.toBe(false);
    });

    it("persists profile updates when account save succeeds", async () => {
      const actions = buildSaveActions();
      localStorage.setItem("user", JSON.stringify({ first_name: "Old", year: "1" }));
      hasToken.mockReturnValue(true);
      patchSettings.mockResolvedValueOnce({ ok: true, data: { user: { first_name: "New", year: 2 } } });
      await expect(saveAccount({ firstName: "New", lastName: "B", email: "x", year: 2 }, actions)).resolves.toBe(true);
      expect(saveUserToStorage).toHaveBeenCalledWith(expect.objectContaining({ first_name: "New", year: "Year 2" }));
    });

    it("validates password updates before saving", async () => {
      const actions = buildSaveActions();
      await expect(savePassword({ newPassword: "short", confirmPassword: "short" }, actions)).resolves.toBe(false);
      await expect(savePassword({ newPassword: "long-enough", confirmPassword: "mismatch" }, actions)).resolves.toBe(false);
      patchSettings.mockResolvedValueOnce({ ok: true, data: {} });
      await expect(savePassword({ newPassword: "long-enough", confirmPassword: "long-enough" }, actions)).resolves.toBe(true);
    });

    it("updates theme preferences and surfaces errors", async () => {
      const actions = buildSaveActions();
      updateUserSettings.mockResolvedValueOnce({ user: { id: 1 } });
      await expect(savePreferences({ theme: "flax", mode: "dark" }, actions)).resolves.toBe(true);
      expect(saveUserToStorage).toHaveBeenCalledWith({ id: 1 });
      updateUserSettings.mockRejectedValueOnce(new Error("nope"));
      await expect(savePreferences({ theme: "flax", mode: "dark" }, actions)).resolves.toBe(false);
    });

    it("saves sleep and scheduling preferences", async () => {
      const actions = buildSaveActions();
      hasToken.mockReturnValue(true);
      updateUserSettings.mockResolvedValueOnce({ settings: { sleep_time: "23:00" } });
      await expect(saveSleep({ sleep_time: "23:00" }, actions)).resolves.toEqual({ sleep_time: "23:00" });
      updateUserSettings.mockResolvedValueOnce({ preferred_study_minutes_per_day: 120 });
      await expect(saveStudyTime({ preferred_study_minutes_per_day: 120 }, actions)).resolves.toEqual({ preferred_study_minutes_per_day: 120 });
      updateUserSettings.mockResolvedValueOnce({ week_preference: "balanced" });
      await expect(saveWeekPreference({ week_preference: "balanced" }, actions)).resolves.toEqual({ week_preference: "balanced" });
      updateUserSettings.mockResolvedValueOnce({ worktime_preference: "morning" });
      await expect(saveWorktimePreference({ worktime_preference: "morning" }, actions)).resolves.toEqual({ worktime_preference: "morning" });
      updateUserSettings.mockResolvedValueOnce({ settings: { sleep_time: "22:00", wake_time: "06:00" } });
      await expect(saveSleepWindow({ sleep_time: "22:00", wake_time: "06:00" }, actions)).resolves.toEqual({ sleep_time: "22:00", wake_time: "06:00" });
    });

    it("stores a geocoded address and dispatches updates", async () => {
      const actions = buildSaveActions();
      geocodeAddress.mockResolvedValueOnce({ latitude: 1, longitude: 2 });
      saveHomeAddress.mockResolvedValueOnce({});
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      await expect(saveAddress("10 Downing St", actions)).resolves.toBe(true);
      expect(saveHomeAddress).toHaveBeenCalledWith("10 Downing St", 1, 2);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "home-address-updated" }));
      dispatchSpy.mockRestore();
    });

    it("handles blank and fallback address saves", async () => {
      const actions = buildSaveActions();
      await expect(saveAddress("   ", actions)).resolves.toBe(false);
      geocodeAddress.mockRejectedValueOnce(new Error("offline"));
      saveHomeAddress.mockResolvedValueOnce({});
      await expect(saveAddress("Fallback address", actions)).resolves.toBe(true);
      saveHomeAddress.mockRejectedValueOnce(new Error("bad save"));
      await expect(saveAddress("Broken address", actions)).resolves.toBe(false);
    });
  });

  it("covers temporary messages and sleep utility thresholds", async () => {
    vi.useFakeTimers();
    const setter = vi.fn();
    showTemporaryMessage(setter, "Saved", 10);
    expect(setter).toHaveBeenCalledWith("Saved");
    vi.advanceTimersByTime(10);
    expect(setter).toHaveBeenLastCalledWith("");
    vi.useRealTimers();

    expect(getSleepMinutes("23:30", "06:15")).toBe(405);
    expect(getSleepMinutes("22:00", "23:30")).toBe(90);
    expect(getSleepDuration("23:30", "06:15")).toEqual(expect.objectContaining({ label: "6h 45m", totalMinutes: 405 }));
    expect(getSleepQuality(600).label).toBe("Too much");
    expect(getSleepQuality(480).label).toBe("Great");
    expect(getSleepQuality(300).label).toBe("Fair");
    expect(getSleepQuality(240).label).toBe("Low");
  });
});
