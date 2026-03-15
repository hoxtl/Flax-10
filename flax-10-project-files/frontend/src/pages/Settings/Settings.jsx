/**
 * Settings page — two-column layout with a sticky sidebar nav and a content panel.
 * Each tab renders a header strip with icon + description, then the form body.
 */
import { useState } from "react";
import { User, Lock, Palette, MapPin, BookOpen } from "lucide-react";
import styles from "./Settings.module.css";
import { SettingsSidebar, SuccessBanner } from "../../components/Settings/SettingsUI";
import AccountForm from "../../components/Settings/AccountForm";
import SecurityForm from "../../components/Settings/SecurityForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import HomeAddressForm from "../../components/Settings/HomeAddressForm";
import CourseChangePanel from "../../components/Settings/CourseChangePanel";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";

const PANEL_META = {
  account:     { icon: User,     title: "Account",     desc: "Manage your personal information and year of study." },
  home:        { icon: MapPin,   title: "Location",    desc: "Set your home address for journey planning on UniMap." },
  security:    { icon: Lock,     title: "Security",    desc: "Keep your account safe with a strong password." },
  preferences: { icon: Palette,  title: "Preferences", desc: "Customise your theme and daily sleep schedule." },
  course:      { icon: BookOpen, title: "Teacher Access", desc: "Manage your teacher request and course changes." },
};

const panelVariantClass = {
  account: "panelAccount",
  home: "panelHome",
  security: "panelSecurity",
  preferences: "panelPreferences",
  course: "panelCourse",
};

function SettingsHeader({ onBack }) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>←</button>
      <h1 className={styles.title}>Settings</h1>
    </div>
  );
}

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
  } = handlers;

  return (
    <div className={`${styles.panel} ${styles[panelVariantClass[activeTab] || "panelDefault"]}`}>
      <PanelHeader tabId={activeTab} />
      <div className={styles.panelBody}>
        {activeTab === "account" && (
          <AccountForm user={user} onSave={handleAccountSave} isSaving={isSaving} />
        )}
        {activeTab === "security" && (
          <SecurityForm onSave={handlePasswordSave} isSaving={isSaving} error={passwordError} />
        )}
        {activeTab === "preferences" && (
          <PreferencesPanel onSave={handlePreferencesSave} onSleepSave={handleSleepSave} isSaving={isSaving} />
        )}
        {activeTab === "home" && (
          <HomeAddressForm onSave={handleHomeAddressSave} isSaving={isSaving} error={homeAddressError} />
        )}
        {activeTab === "course" && <CourseChangePanel user={user} />}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.user - Authenticated user object
 * @param {Function} props.onBack - Called when the back button is pressed
 */
export default function Settings({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const handlers = useSettingsHandlers(onBack);

  return (
    <div className={styles.container}>
      <SettingsHeader onBack={onBack} />
      <SuccessBanner message={handlers.successMessage} />
      <div className={styles.content}>
        <SettingsSidebar activeTab={activeTab} onChange={setActiveTab} user={user} />
        <div className={styles.contentMain}>
          <SettingsPanel activeTab={activeTab} handlers={handlers} user={user} />
        </div>
      </div>
    </div>
  );
}
