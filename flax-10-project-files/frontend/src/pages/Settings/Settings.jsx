import { useState } from "react";
import styles from "./Settings.module.css";
import { SettingsTabs, SuccessBanner } from "../../components/Settings/SettingsUI";
import AccountForm from "../../components/Settings/AccountForm";
import SecurityForm from "../../components/Settings/SecurityForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

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
  const { isSaving, successMessage, passwordError, handleAccountSave, handlePasswordSave, handlePreferencesSave } = useSettingsHandlers(onBack);

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