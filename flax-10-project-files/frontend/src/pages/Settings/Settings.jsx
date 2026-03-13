import { useState } from "react";
import styles from "./Settings.module.css";
import {
  SettingsTabs,
  SuccessBanner,
} from "../../components/Settings/SettingsUI";
import AccountForm from "../../components/Settings/AccountForm";
import SecurityForm from "../../components/Settings/SecurityForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import HomeAddressForm from "../../components/Settings/HomeAddressForm";
import { SleepSchedulePanel } from "../../components/Settings/SleepSchedulePanel";
import CourseChangePanel from "../../components/Settings/CourseChangePanel";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

function SettingsHeader({ onBack }) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        ←
      </button>
      <h1 className={styles.title}>Settings</h1>
    </div>
  );
}

function SettingsPanel({ activeTab, handlers, user }) {
  const {
    isSaving,
    passwordError,
    handleAccountSave,
    handlePasswordSave,
    handlePreferencesSave,
    handleHomeAddressSave,
    homeAddressError,
    handleSleepSave,
  } = handlers;
  return (
    <div className={styles.panel}>
      {activeTab === "account" && (
        <AccountForm
          user={user}
          onSave={handleAccountSave}
          isSaving={isSaving}
        />
      )}
      {activeTab === "security" && (
        <SecurityForm
          onSave={handlePasswordSave}
          isSaving={isSaving}
          error={passwordError}
        />
      )}
      {activeTab === "preferences" && (
        <PreferencesPanel onSave={handlePreferencesSave} isSaving={isSaving} />
      )}
      {activeTab === "home" && (
        <HomeAddressForm
          onSave={handleHomeAddressSave}
          isSaving={isSaving}
          error={homeAddressError}
        />
      )}
      {activeTab === "sleep" && (
        <SleepSchedulePanel onSave={handleSleepSave} isSaving={isSaving} />
      )}
      {activeTab === "course" && <CourseChangePanel user={user} />}
    </div>
  );
}

export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const handlers = useSettingsHandlers(onBack);
  return (
    <div className={styles.container}>
      <SettingsHeader onBack={onBack} />
      <SuccessBanner message={handlers.successMessage} />
      <div className={styles.content}>
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
        <SettingsPanel activeTab={activeTab} handlers={handlers} user={user} />
      </div>
    </div>
  );
}
