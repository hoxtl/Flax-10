import { useState } from "react";
import { updateUserSettings } from '../../../api/userService';
import { patchSettings, saveUserToStorage, clearAuthAndRedirect, hasToken } from '../../../api/settingsApi';

function showTemporaryMessage(setter, message, duration = 3000) {
  setter(message);
  setTimeout(() => setter(""), duration);
}

function isPasswordTooShort(password) { return password.length < 8; }
function passwordsDoNotMatch(a, b) { return a !== b; }

async function saveAccount(data, setPasswordError, setSuccessMessage, setIsSaving) {
  if (!hasToken()) { setPasswordError("You are not logged in, please try again..."); return; }
  const { ok, data: res } = await patchSettings({
    first_name: data.firstName, last_name: data.lastName, year: data.year, major: data.major,
  }).catch(() => ({ ok: false, data: {} }));
  if (ok && res.user) { saveUserToStorage(res.user); showTemporaryMessage(setSuccessMessage, "The account has been updated!"); }
  else { setPasswordError(res.error || "The account update has failed..."); }
  setIsSaving(false);
}

async function savePassword(data, setPasswordError, setSuccessMessage, setIsSaving) {
  if (isPasswordTooShort(data.newPassword)) { setPasswordError("Password must be at least 8 characters long"); return; }
  if (passwordsDoNotMatch(data.newPassword, data.confirmPassword)) { setPasswordError("New passwords do not match"); return; }
  if (!hasToken()) { setPasswordError("You are not logged in"); return; }
  setIsSaving(true);
  const { ok, data: res } = await patchSettings({ password: data.newPassword })
    .catch(() => ({ ok: false, data: { error: "Failed to change password" } }));
  if (!ok) { setPasswordError(res.error || "Failed to change password"); setIsSaving(false); return; }
  showTemporaryMessage(setSuccessMessage, "Password changed! Please log in again.");
  setTimeout(clearAuthAndRedirect, 2000);
  setIsSaving(false);
}

async function savePreferences(data, setSuccessMessage, setIsSaving) {
  try {
    const response = await updateUserSettings({ theme: data.theme });
    if (response?.user) saveUserToStorage(response.user);
    showTemporaryMessage(setSuccessMessage, "Preferences saved successfully!");
  } catch (error) {
    console.error("Failed to save preferences:", error);
    showTemporaryMessage(setSuccessMessage, "Failed to save preferences");
  } finally {
    setIsSaving(false);
  }
}

function useSettingsState() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  return { isSaving, setIsSaving, successMessage, setSuccessMessage, passwordError, setPasswordError };
}

export default function useSettingsHandlers() {
  const { isSaving, setIsSaving, successMessage, setSuccessMessage, passwordError, setPasswordError } = useSettingsState();
  const handleAccountSave = async (data) => {
    setIsSaving(true); setPasswordError("");
    await saveAccount(data, setPasswordError, setSuccessMessage, setIsSaving);
  };
  const handlePasswordSave = async (data) => {
    setPasswordError("");
    await savePassword(data, setPasswordError, setSuccessMessage, setIsSaving);
  };
  const handlePreferencesSave = async (data) => {
    setIsSaving(true);
    await savePreferences(data, setSuccessMessage, setIsSaving);
  };
  return { isSaving, successMessage, passwordError, handleAccountSave, handlePasswordSave, handlePreferencesSave };}