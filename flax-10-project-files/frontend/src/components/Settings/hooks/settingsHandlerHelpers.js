/*
 * Shared async helpers for settings save handlers.
 */
import {
  clearAuthAndRedirect,
  hasToken,
  patchSettings,
  saveUserToStorage,
} from "../../../api/settingsApi";
import {
  geocodeAddress,
  saveHomeAddress,
  updateUserSettings,
} from "../../../api/userService";

export function showTemporaryMessage(setter, message, duration = 3000) {
  setter(message);
  setTimeout(() => setter(""), duration);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normaliseYearForStorage(year) {
  if (!year) return year;
  if (typeof year === "string" && /^year\s+/i.test(year)) return year;
  return !Number.isNaN(Number(year)) ? `Year ${year}` : year;
}

function mergeAccountSettingsToUser(storedUser, settingsPayload) {
  if (!settingsPayload) return storedUser;
  if (!storedUser) return settingsPayload;
  const updates = buildUserUpdates(settingsPayload);
  if (!Object.keys(updates).length) return storedUser;
  return { ...storedUser, ...updates };
}

function buildUserUpdates(settingsPayload) {
  const updates = {};
  if (settingsPayload.first_name !== undefined) updates.first_name = settingsPayload.first_name;
  if (settingsPayload.last_name !== undefined) updates.last_name = settingsPayload.last_name;
  if (settingsPayload.email !== undefined) updates.email = settingsPayload.email;
  if (settingsPayload.major !== undefined) updates.major = settingsPayload.major;
  if (settingsPayload.year !== undefined) updates.year = normaliseYearForStorage(settingsPayload.year);
  return updates;
}

function saveAuthUser(user) {
  if (!user) return;
  saveUserToStorage(user);
  window.dispatchEvent(new Event("auth-changed"));
}

function getAccountPayload(data) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    year: data.year,
  };
}

async function patchSettingsSafe(payload, fallback) {
  return patchSettings(payload).catch(() => fallback);
}

function setHandlerError(setter, message, setIsSaving) {
  setter(message);
  if (setIsSaving) setIsSaving(false);
  return false;
}

export async function saveAccount(data, actions) {
  const { setPasswordError, setSuccessMessage, setIsSaving } = actions;
  if (!hasToken()) return setHandlerError(setPasswordError, "You are not logged in, please try again...", setIsSaving);
  const response = await patchSettingsSafe(getAccountPayload(data), { ok: false, data: {} });
  if (!response.ok) return setHandlerError(setPasswordError, response.data.error || "The account update has failed...", setIsSaving);
  const incoming = response.data.user || response.data;
  saveAuthUser(mergeAccountSettingsToUser(getStoredUser(), incoming));
  showTemporaryMessage(setSuccessMessage, "The account has been updated!");
  setIsSaving(false);
  return true;
}

function validatePassword(data, setPasswordError) {
  if (data.newPassword.length < 8) return setHandlerError(setPasswordError, "Password must be at least 8 characters long");
  return data.newPassword === data.confirmPassword
    ? true
    : setHandlerError(setPasswordError, "New passwords do not match");
}

export async function savePassword(data, actions) {
  const { setPasswordError, setSuccessMessage, setIsSaving } = actions;
  if (!validatePassword(data, setPasswordError)) return false;
  if (!hasToken()) return setHandlerError(setPasswordError, "You are not logged in");
  setIsSaving(true);
  const response = await patchSettingsSafe({ password: data.newPassword }, { ok: false, data: { error: "Failed to change password" } });
  if (!response.ok) return setHandlerError(setPasswordError, response.data.error || "Failed to change password", setIsSaving);
  showTemporaryMessage(setSuccessMessage, "Password changed! Please log in again.");
  setTimeout(clearAuthAndRedirect, 2000);
  setIsSaving(false);
  return true;
}

export async function savePreferences(data, actions) {
  const { setSuccessMessage, setIsSaving } = actions;
  const response = await updateUserSettings({ theme: data.theme, mode: data.mode }).catch(() => null);
  if (response?.user) saveUserToStorage(response.user);
  showTemporaryMessage(setSuccessMessage, response ? "Preferences saved successfully!" : "Failed to save preferences");
  setIsSaving(false);
  return Boolean(response);
}

function createPatchSaveHandler(key, successMessage, errorMessage) {
  return async (data, actions) => {
    const { setSuccessMessage, setIsSaving } = actions;
    if (!hasToken()) return false;
    setIsSaving(true);
    const payload = { [key]: data[key] };
    const response = await patchSettingsSafe(payload, { ok: false });
    showTemporaryMessage(setSuccessMessage, response.ok ? successMessage : errorMessage);
    setIsSaving(false);
    return response.ok;
  };
}

export const saveSleep = createPatchSaveHandler(
  "sleep_time",
  "Sleep schedule saved!",
  "Failed to save sleep schedule",
);

export const saveStudyTime = createPatchSaveHandler(
  "preferred_study_minutes_per_day",
  "Study time preference saved!",
  "Failed to save study time preference",
);

export const saveWeekPreference = createPatchSaveHandler(
  "week_preference",
  "Week preference saved!",
  "Failed to save week preference",
);

export const saveWorktimePreference = createPatchSaveHandler(
  "worktime_preference",
  "Worktime preference saved!",
  "Failed to save worktime preference",
);

export async function saveSleepWindow(data, actions) {
  const { setSuccessMessage, setIsSaving } = actions;
  if (!hasToken()) return false;
  setIsSaving(true);
  const payload = { sleep_time: data.sleep_time, wake_time: data.wake_time };
  const response = await patchSettingsSafe(payload, { ok: false });
  showTemporaryMessage(setSuccessMessage, response.ok ? "Sleep schedule saved!" : "Failed to save sleep schedule");
  setIsSaving(false);
  return response.ok;
}

function notifyHomeAddressUpdated() {
  window.dispatchEvent(new CustomEvent("home-address-updated"));
}

export async function saveAddress(address, actions) {
  const { setHomeAddressError, setSuccessMessage, setIsSaving } = actions;
  if (!address.trim()) return setHandlerError(setHomeAddressError, "Please enter a valid home address");
  setIsSaving(true);
  setHomeAddressError("");
  setSuccessMessage("");
  const coords = await geocodeAddress(address).catch(() => null);
  if (!coords) return setHandlerError(setHomeAddressError, "Address not found, please try again...", setIsSaving);
  try {
    await saveHomeAddress(address, coords.latitude, coords.longitude);
    notifyHomeAddressUpdated();
    showTemporaryMessage(setSuccessMessage, "Home address has been saved!");
    return true;
  } catch {
    return setHandlerError(setHomeAddressError, "Home address could not be saved, please try again...");
  } finally {
    setIsSaving(false);
  }
}
