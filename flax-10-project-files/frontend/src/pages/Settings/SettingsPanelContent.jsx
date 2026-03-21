/*
 * Panel header and body selection for the settings page.
 */
import styles from "./Settings.module.css";
import AccountForm from "../../components/Settings/AccountForm";
import CourseChangePanel from "../../components/Settings/CourseChangePanel";
import HomeAddressForm from "../../components/Settings/HomeAddressForm";
import PreferencesPanel from "../../components/Settings/PreferencesPanel";
import SecurityForm from "../../components/Settings/SecurityForm";
import { PANEL_META, panelVariantClass } from "./settingsPageConfig";

function PanelHeader({ tabId }) {
  const meta = PANEL_META[tabId];
  if (!meta) return null;
  const Icon = meta.icon;
  return <div className={styles.panelHeader}><div className={styles.panelHeaderIcon}><Icon size={16} strokeWidth={2} /></div><div className={styles.panelHeaderText}><h2 className={styles.panelHeaderTitle}>{meta.title}</h2><p className={styles.panelHeaderDesc}>{meta.desc}</p></div></div>;
}

function getPanelBody(activeTab, handlers, user) {
  if (activeTab === "account") return <AccountForm user={user} onSave={handlers.handleAccountSave} isSaving={handlers.isSaving} />;
  if (activeTab === "security") return <SecurityForm onSave={handlers.handlePasswordSave} isSaving={handlers.isSaving} error={handlers.passwordError} />;
  if (activeTab === "preferences_themes" || activeTab === "preferences") return <PreferencesPanel onSave={handlers.handlePreferencesSave} onSleepSave={handlers.handleSleepSave} onStudyTimeSave={handlers.handleStudyTimeSave} onWeekPreferenceSave={handlers.handleWeekPreferenceSave} onWorktimePreferenceSave={handlers.handleWorktimePreferenceSave} isSaving={handlers.isSaving} activeSubTab="themes" />;
  if (activeTab === "preferences_sleep") return <PreferencesPanel onSave={handlers.handlePreferencesSave} onSleepSave={handlers.handleSleepSave} onStudyTimeSave={handlers.handleStudyTimeSave} onWeekPreferenceSave={handlers.handleWeekPreferenceSave} onWorktimePreferenceSave={handlers.handleWorktimePreferenceSave} isSaving={handlers.isSaving} activeSubTab="sleep" />;
  if (activeTab === "preferences_scheduling") return <PreferencesPanel onSave={handlers.handlePreferencesSave} onSleepSave={handlers.handleSleepSave} onStudyTimeSave={handlers.handleStudyTimeSave} onWeekPreferenceSave={handlers.handleWeekPreferenceSave} onWorktimePreferenceSave={handlers.handleWorktimePreferenceSave} isSaving={handlers.isSaving} activeSubTab="scheduling" />;
  if (activeTab === "home") return <HomeAddressForm onSave={handlers.handleHomeAddressSave} isSaving={handlers.isSaving} error={handlers.homeAddressError} />;
  return <CourseChangePanel user={user} />;
}

export default function SettingsPanelContent({ activeTab, handlers, user }) {
  const panelClassName = styles[panelVariantClass[activeTab] || "panelDefault"];
  return <div className={`${styles.panel} ${panelClassName}`}><PanelHeader tabId={activeTab} /><div className={styles.panelBody}>{getPanelBody(activeTab, handlers, user)}</div></div>;
}
