/*
 * Admin dashboard entry point.
 */

import { useState } from "react";
import { BackToTop } from "../../components/Pagination/Pagination";
import Tabs from "../../components/common/Tabs/Tabs";
import AppPage from "../../components/common/AppPage/AppPage";
import styles from "./styles";
import { buildAdminTabs } from "./adminTabs.jsx";

function AdminTitle() {
  return (
    <>
      <span className={styles.adminWord}>Admin</span>
      <span className={styles.dashboardWord}> Dashboard</span>
    </>
  );
}

function AdminSubtitle() {
  return (
    <span className={styles.subtitleText}>
      Manage users, societies and platform requests
    </span>
  );
}

export default function AdminPage({ onNavChange, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
  const tabs = buildAdminTabs(onNavChange);
  return (
    <>
      <AppPage title={<AdminTitle />} subtitle={<AdminSubtitle />} onBack={onBack} backPlacement="above" width="xl">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      </AppPage>
      <BackToTop />
    </>
  );
}
