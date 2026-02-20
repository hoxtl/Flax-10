import { useState } from "react";
import styles from "./Settings.module.css";
import { updateUserSettings } from '../api/userService';
import { SettingsTabs, SuccessBanner } from "../components/Settings/SettingsUI";
import AccountForm from "../components/Settings/AccountForm";
import SecurityForm from "../components/Settings/SecurityForm";
import PreferencesPanel from "../components/Settings/PreferencesPanel";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
    try {
      const token = localStorage.getItem('token');
      if (!token) { setPasswordError("You are not logged in, please try again..."); return; }

      const response = await fetch(`${API_BASE_URL}/settings/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ first_name: data.firstName, last_name: data.lastName, year: data.year, major: data.major })
      });
      const responseData = await response.json();

      if (response.ok && responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
        showTemporaryMessage(setSuccessMessage, "The account has been updated!");
        setTimeout(() => { onBack(); window.location.reload(); }, 1000);
      } else {
        setPasswordError(responseData.error || "The account update has failed...");
      }
    } catch {
      setPasswordError("Action failed, please try again...");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (data) => {
    setPasswordError("");
    if (isPasswordTooShort(data.newPassword)) { setPasswordError("Password must be at least 8 characters long"); return; }
    if (passwordsDoNotMatch(data.newPassword, data.confirmPassword)) { setPasswordError("New passwords do not match"); return; }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setPasswordError("You are not logged in"); return; }

      const response = await fetch(`${API_BASE_URL}/settings/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ password: data.newPassword })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      showTemporaryMessage(setSuccessMessage, "Password changed! Please log in again.");
      setTimeout(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }, 2000);
    } catch (error) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async (data) => {
    setIsSaving(true);
    try {
      const response = await updateUserSettings({ theme: data.theme });
      if (response.user) localStorage.setItem('user', JSON.stringify(response.user));
      showTemporaryMessage(setSuccessMessage, "Preferences saved successfully!");
    } catch {
      showTemporaryMessage(setSuccessMessage, "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
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