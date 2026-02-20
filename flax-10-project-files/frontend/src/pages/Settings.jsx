import { useState } from "react";
import styles from "./Settings.module.css";
import { updateUserSettings } from '../api/userService';
import { patchSettings, saveUserToStorage, clearAuthAndRedirect, hasToken } from '../api/settingsApi';
import { SettingsTabs, SuccessBanner } from "../components/Settings/SettingsUI";
import AccountForm from "../components/Settings/AccountForm";
import SecurityForm from "../components/Settings/SecurityForm";
import PreferencesPanel from "../components/Settings/PreferencesPanel";

function showTemporaryMessage(setter, message, duration = 3000) {
  setter(message);
  setTimeout(() => setter(""), duration);
}

function isPasswordTooShort(password) { return password.length < 8; }
function passwordsDoNotMatch(a, b) { return a !== b; }

function SettingsHeader({ onBack }) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>←</button>
      <h1 className={styles.title}>Settings</h1>
    </div>
  );
}

export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleAccountSave = async (data) => {
    setIsSaving(true);
    setPasswordError("");

    if (!hasToken()) {
      setPasswordError("You are not logged in, please try again...");
      setIsSaving(false);
      return;
    }

    const { ok, data: res } = await patchSettings({
      first_name: data.firstName,
      last_name: data.lastName,
      year: data.year,
      major: data.major,
    }).catch(() => ({ ok: false, data: {} }));

    if (ok && res.user) {
      saveUserToStorage(res.user);
      showTemporaryMessage(setSuccessMessage, "The account has been updated!");
      setTimeout(() => { onBack(); window.location.reload(); }, 1000);
    } else {
      setPasswordError(res.error || "The account update has failed...");
    }

    setIsSaving(false);
  };

  const handlePasswordSave = async (data) => {
    setPasswordError("");
    if (isPasswordTooShort(data.newPassword)) { setPasswordError("Password must be at least 8 characters long"); return; }
    if (passwordsDoNotMatch(data.newPassword, data.confirmPassword)) { setPasswordError("New passwords do not match"); return; }
    if (!hasToken()) { setPasswordError("You are not logged in"); return; }

    setIsSaving(true);
    const { ok, data: res } = await patchSettings({ password: data.newPassword })
      .catch(() => ({ ok: false, data: { error: "Failed to change password" } }));

    if (!ok) {
      setPasswordError(res.error || "Failed to change password");
      setIsSaving(false);
      return;
    }

    showTemporaryMessage(setSuccessMessage, "Password changed! Please log in again.");
    setTimeout(clearAuthAndRedirect, 2000);
    setIsSaving(false);
  };

  const handlePreferencesSave = async (data) => {
    setIsSaving(true);
    const response = await updateUserSettings({ theme: data.theme }).catch(() => null);
    if (response?.user) saveUserToStorage(response.user);
    showTemporaryMessage(setSuccessMessage, response ? "Preferences saved!" : "Failed to save preferences");
    setIsSaving(false);
  };

  return (
    <div className={styles.container}>
      <SettingsHeader onBack={onBack} />
      <SuccessBanner message={successMessage} />
      <div className={styles.content}>
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className={styles.panel}>
          {activeTab === "account" && <AccountForm user={user} onSave={handleAccountSave} isSaving={isSaving} />}
          {activeTab === "security" && <SecurityForm onSave={handlePasswordSave} isSaving={isSaving} error={passwordError} />}
          {activeTab === "preferences" && <PreferencesPanel onSave={handlePreferencesSave} isSaving={isSaving} />}
        </div>
      </div>
    </div>
  );
}