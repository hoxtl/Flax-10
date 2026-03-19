/*
 * Settings page shell and tab state.
 */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./Settings.module.css";
import { ErrorMessage, SettingsSidebar } from "../../components/Settings/SettingsUI";
import AppPage from "../../components/common/AppPage/AppPage";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";
import SettingsPanelContent from "./SettingsPanelContent";
import { VALID_TABS } from "./settingsPageConfig";

function useActiveTab() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(VALID_TABS.has(tabFromUrl) ? tabFromUrl : "account");

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.has(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return { activeTab, setActiveTab };
}

export default function Settings({ user }) {
  const { activeTab, setActiveTab } = useActiveTab();
  const handlers = useSettingsHandlers();

  return (
    <AppPage title="Settings" width="lg" className={styles.pageWrapper}>
      <ErrorMessage message={handlers.bannerMessage} />
      <div className={styles.content}>
        <SettingsSidebar activeTab={activeTab} onChange={setActiveTab} user={user} />
        <div className={styles.contentMain}>
          <SettingsPanelContent activeTab={activeTab} handlers={handlers} user={user} />
        </div>
      </div>
    </AppPage>
  );
}
