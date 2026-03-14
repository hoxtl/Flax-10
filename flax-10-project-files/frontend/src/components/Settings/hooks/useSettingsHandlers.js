import { useState } from "react";
import { updateUserSettings } from "../../../api/userService";
import {
  patchSettings,
  saveUserToStorage,
  clearAuthAndRedirect,
  hasToken,
} from "../../../api/settingsApi";
import { saveHomeAddress, geocodeAddress } from "../../../api/userService";

function showTemporaryMessage(setter, message, duration = 3000) {
  setter(message);
  setTimeout(() => setter(""), duration);
}
function isPasswordTooShort(password) {
  return password.length < 8;
}
function passwordsDoNotMatch(a, b) {
  return a !== b;
}

async function saveAccount(
  data,
  setPasswordError,
  setSuccessMessage,
  setIsSaving,
) {
  if (!hasToken()) {
    setPasswordError("You are not logged in, please try again...");
    return;
  }
  const { ok, data: res } = await patchSettings({
    first_name: data.firstName,
    last_name: data.lastName,
    year: data.year,
  }).catch(() => ({ ok: false, data: {} }));
  if (ok && res.user) {
    saveUserToStorage(res.user);
    showTemporaryMessage(setSuccessMessage, "The account has been updated!");
  } else {
    setPasswordError(res.error || "The account update has failed...");
  }
  setIsSaving(false);
}

async function savePassword(
  data,
  setPasswordError,
  setSuccessMessage,
  setIsSaving,
) {
  if (isPasswordTooShort(data.newPassword)) {
    setPasswordError("Password must be at least 8 characters long");
    return;
  }
  if (passwordsDoNotMatch(data.newPassword, data.confirmPassword)) {
    setPasswordError("New passwords do not match");
    return;
  }
  if (!hasToken()) {
    setPasswordError("You are not logged in");
    return;
  }
  setIsSaving(true);
  const { ok, data: res } = await patchSettings({
    password: data.newPassword,
  }).catch(() => ({ ok: false, data: { error: "Failed to change password" } }));
  if (!ok) {
    setPasswordError(res.error || "Failed to change password");
    setIsSaving(false);
    return;
  }
  showTemporaryMessage(
    setSuccessMessage,
    "Password changed! Please log in again.",
  );
  setTimeout(clearAuthAndRedirect, 2000);
  setIsSaving(false);
}

async function tryUpdateSettings(data) {
  const response = await updateUserSettings({ theme: data.theme });
  if (response?.user) saveUserToStorage(response.user);
  return response;
}

async function savePreferences(data, setSuccessMessage, setIsSaving) {
  const response = await tryUpdateSettings(data).catch(() => null);
  const msg = response
    ? "Preferences saved successfully!"
    : "Failed to save preferences";
  showTemporaryMessage(setSuccessMessage, msg);
  setIsSaving(false);
}

async function saveSleep(data, setSuccessMessage, setIsSaving) {
  if (!hasToken()) return;
  setIsSaving(true);
  const { ok } = await patchSettings({
    sleep_time: data.sleep_time,
    wake_time: data.wake_time,
  }).catch(() => ({ ok: false }));
  const msg = ok ? "Sleep schedule saved!" : "Failed to save sleep schedule";
  showTemporaryMessage(setSuccessMessage, msg);
  setIsSaving(false);
}

function useSettingsState() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  return {
    isSaving,
    setIsSaving,
    successMessage,
    setSuccessMessage,
    passwordError,
    setPasswordError,
  };
}

export default function useSettingsHandlers() {
  const {
    isSaving,
    setIsSaving,
    successMessage,
    setSuccessMessage,
    passwordError,
    setPasswordError,
  } = useSettingsState();
  const [homeAddressError, setHomeAddressError] = useState("");

  const handleAccountSave = async (data) => {
    setIsSaving(true);
    setPasswordError("");
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
  const handleHomeAddressSave = async (address) => {
    if (!address.trim()) {
      setHomeAddressError("Please enter a valid home address");
      return;
    }
    setIsSaving(true);
    setHomeAddressError("");
    setSuccessMessage("");

    try {
      const coords = await geocodeAddress(address);

      if (!coords) {
        setHomeAddressError("Address not found, please try again...");
        setIsSaving(false);
        return;
      }

      await saveHomeAddress(address, coords.latitude, coords.longitude);

      window.dispatchEvent(new CustomEvent("home-address-updated"));

      setSuccessMessage("Home address has been saved!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setHomeAddressError(
        "Home address could not be saved, please try again...",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSleepSave = async (data) => {
    await saveSleep(data, setSuccessMessage, setIsSaving);
  };

  return {
    isSaving,
    successMessage,
    passwordError,
    homeAddressError,
    handleAccountSave,
    handlePasswordSave,
    handlePreferencesSave,
    handleHomeAddressSave,
    handleSleepSave,
  };
}
