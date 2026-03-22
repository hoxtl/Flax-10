 /*
 * Settings page shell and tab state.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ErrorMessage, SettingsSidebar } from "../../components/Settings/SettingsUI";
import useSettingsHandlers from "../../components/Settings/hooks/useSettingsHandlers";
import AppPage from "../../components/Common/AppPage/AppPage";
import styles from "./Settings.module.css";
import SettingsPanelContent from "./SettingsPanelContent";
import { VALID_TABS } from "./settingsPageConfig";

function useActiveTab() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(getValidTab(tabFromUrl));

  useEffect(() => {
    setActiveTab(getValidTab(tabFromUrl));
  }, [tabFromUrl]);

  return { activeTab, setActiveTab };
}

function getValidTab(tabId) {
  return VALID_TABS.has(tabId) ? tabId : "account";
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
