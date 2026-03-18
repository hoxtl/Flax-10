/**
 * Settings page — two-column layout with a sticky sidebar nav and a content panel.
 * Each tab renders a header strip with icon + description, then the form body.
 */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Lock, Palette, MapPin, BookOpen } from "lucide-react";
import styles from "./Settings.module.css";
import { SettingsSidebar, SuccessBanner } from "../../components/Settings/SettingsUI";
import AccountForm from "../../components/Settings/AccountForm";
import SecurityForm from "../../components/Settings/SecurityForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import HomeAddressForm from "../../components/Settings/HomeAddressForm";
import CourseChangePanel from "../../components/Settings/CourseChangePanel";
import AppPage from "../../components/common/AppPage/AppPage";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

const PANEL_META = {
  account: { icon: User, title: "Account", desc: "Manage your personal information and year of study." },
  home: { icon: MapPin, title: "Location", desc: "Set your home address for journey planning on UniMap." },
  security: { icon: Lock, title: "Security", desc: "Update your password anytime." },
  preferences: { icon: Palette, title: "Preferences", desc: "Customise your theme and daily sleep schedule." },
  preferences_themes: { icon: Palette, title: "Appearance", desc: "Customise how StudyFlax looks." },
  preferences_sleep: { icon: Palette, title: "Sleep Schedule", desc: "Manage your daily sleep and wake times." },
  course: { icon: BookOpen, title: "Teacher Access", desc: "Manage your teacher request and course changes." },
};

const panelVariantClass = {
  account: "panelAccount",
  home: "panelHome",
  security: "panelSecurity",
  preferences: "panelPreferences",
  preferences_themes: "panelPreferences",
  preferences_sleep: "panelPreferences",
  course: "panelCourse",
};

function PanelHeader({ tabId }) {
  const meta = PANEL_META[tabId];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className={styles.panelHeader}>
      <div className={styles.panelHeaderIcon}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className={styles.panelHeaderText}>
        <h2 className={styles.panelHeaderTitle}>{meta.title}</h2>
        <p className={styles.panelHeaderDesc}>{meta.desc}</p>
      </div>
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
    successMessage,
    handleStudyTimeSave,
    handleWeekPreferenceSave,
    handleWorktimePreferenceSave,
  } = handlers;

  return (
    <div className={`${styles.panel} ${styles[panelVariantClass[activeTab] || "panelDefault"]}`}>
      {successMessage && <SuccessBanner message={successMessage} />}
      <PanelHeader tabId={activeTab} />
      <div className={styles.panelBody}>
        {activeTab === "account" && (
          <AccountForm user={user} onSave={handleAccountSave} isSaving={isSaving} />
        )}
        {activeTab === "security" && (
          <SecurityForm onSave={handlePasswordSave} isSaving={isSaving} error={passwordError} />
        )}
        {activeTab === "preferences" && (
          <PreferencesPanel
            onSave={handlePreferencesSave}
            onSleepSave={handleSleepSave}
            onStudyTimeSave={handleStudyTimeSave}
            onWeekPreferenceSave={handleWeekPreferenceSave}
            onWorktimePreferenceSave={handleWorktimePreferenceSave}
            isSaving={isSaving}
          />
        )}
        {activeTab === "home" && (
          <HomeAddressForm onSave={handleHomeAddressSave} isSaving={isSaving} error={homeAddressError} />
        )}
        {activeTab === "course" && <CourseChangePanel user={user} />}
      </div>
    </div>
  );
}

const VALID_TABS = new Set(Object.keys(PANEL_META));

export default function Settings({ user, onBack }) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.has(tabFromUrl) ? tabFromUrl : "account",
  );
  const handlers = useSettingsHandlers();

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.has(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return (
    <AppPage
      title="Settings"
      width="lg"
      className={styles.pageWrapper}
      onBack={onBack}
    >
      <div className={styles.content}>
        <SettingsSidebar activeTab={activeTab} onChange={setActiveTab} user={user} />
        <div className={styles.contentMain}>
          <SettingsPanel activeTab={activeTab} handlers={handlers} user={user} />
        </div>
      </div>
    </AppPage>
  );
}
