import { useState } from "react";
import AppPage from "../../components/common/AppPage/AppPage";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import styles from "./Settings.module.css";
import { SuccessBanner } from "../../components/Settings/SettingsUI";
import AccountForm from "../../components/Settings/AccountForm";
import SecurityForm from "../../components/Settings/SecurityForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import HomeAddressForm from "../../components/Settings/HomeAddressForm";
import { SleepSchedulePanel } from "../../components/Settings/SleepSchedulePanel";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

function SettingsPanel({ activeTab, handlers, user }) {
  const { isSaving, passwordError, handleAccountSave, handlePasswordSave, handlePreferencesSave, handleHomeAddressSave, homeAddressError, handleSleepSave } = handlers;
  return (
    <div className={styles.panel}>
      {activeTab === "account" && <AccountForm user={user} onSave={handleAccountSave} isSaving={isSaving} />}
      {activeTab === "security" && <SecurityForm onSave={handlePasswordSave} isSaving={isSaving} error={passwordError} />}
      {activeTab === "preferences" && <PreferencesPanel onSave={handlePreferencesSave} isSaving={isSaving} />}
      {activeTab === "home" && <HomeAddressForm onSave={handleHomeAddressSave} isSaving={isSaving} error={homeAddressError} />}
      {activeTab === "sleep" && <SleepSchedulePanel onSave={handleSleepSave} isSaving={isSaving} />}
    </div>
  );
}

const SETTINGS_TABS = [
  { value: "account", label: "Account" },
  { value: "security", label: "Security" },
  { value: "preferences", label: "Preferences" },
  { value: "home", label: "Home Address" },
  { value: "sleep", label: "Sleep Schedule" },
];

export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const handlers = useSettingsHandlers(onBack);
  return (
    <AppPage
      title="Settings"
      subtitle="Manage your account preferences and security"
      className={styles.container}
      onBack={onBack}
    >
      <SuccessBanner message={handlers.successMessage} />
      <div className={styles.content}>
        <div className={styles.tabsWrapper}>
          <SegmentedControl
            options={SETTINGS_TABS}
            value={activeTab}
            onChange={setActiveTab}
            fill
          />
        </div>
        <SettingsPanel activeTab={activeTab} handlers={handlers} user={user} />
      </div>
    </AppPage>
  );
}
