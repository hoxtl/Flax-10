/*
 * Admin dashboard entry point.
 */

import { useState } from "react";
import { ArrowUpRight, KeyRound, Shield } from "lucide-react";
import { BackToTop } from "../../components/pagination/Pagination";
import Tooltip from "../../components/common/tooltip/Tooltip";
import Tabs from "../../components/common/tabs/Tabs";
import AppPage from "../../components/common/app_page/AppPage";
import styles from "./styles";
import { buildAdminTabs } from "./adminTabs.jsx";

const DJANGO_ADMIN_URL = "http://localhost:8000/admin/login/?next=/admin/";
const DJANGO_ADMIN_TOOLTIP = {
  username: "johndoe",
  password: "1234",
};

function DjangoAdminTooltip() {
  return (
    <div className={styles.adminTooltipContent}>
      <span className={styles.adminTooltipTitle}>Quick login</span>
      <span className={styles.adminTooltipLine}>
        <span className={styles.adminTooltipLabel}>Username</span>
        <strong>{DJANGO_ADMIN_TOOLTIP.username}</strong>
      </span>
      <span className={styles.adminTooltipLine}>
        <span className={styles.adminTooltipLabel}>Password</span>
        <strong>{DJANGO_ADMIN_TOOLTIP.password}</strong>
      </span>
    </div>
  );
}

function ReportingHeroCopy() {
  return (
    <div className={styles.reportingHeroCopy}>
      <span className={styles.adminActionBadge}><Shield size={14} strokeWidth={2.2} aria-hidden />Flax admin</span>
      <h1 className={styles.reportingHeroTitle}>View Detailed Reporting</h1>
      <p className={styles.reportingHeroText}>Open the full Django admin console for deeper moderation, reporting, and platform review tools.</p>
    </div>
  );
}

function AdminLaunchLink() {
  const title = `Username: ${DJANGO_ADMIN_TOOLTIP.username}, Password: ${DJANGO_ADMIN_TOOLTIP.password}`;
  return (
    <a className={styles.adminLaunchButton} href={DJANGO_ADMIN_URL} title={title} aria-label="Open detailed reporting in Django admin">
      <span className={styles.adminLaunchBody}><span className={styles.adminLaunchTitle}>Open Flax Admin</span><span className={styles.adminLaunchCopy}>Hover for login details</span></span>
      <span className={styles.adminLaunchArrow}>Launch<ArrowUpRight size={18} strokeWidth={2.2} aria-hidden /></span>
      <span className={styles.adminLaunchMeta}><KeyRound size={15} strokeWidth={2.1} aria-hidden />Username `johndoe`, password `1234`</span>
    </a>
  );
}

function ReportingHero() {
  return (
    <section className={styles.reportingHero}>
      <ReportingHeroCopy />
      <Tooltip content={<DjangoAdminTooltip />} position="bottom" wrapperClassName={styles.adminActionWrap}>
        <AdminLaunchLink />
      </Tooltip>
    </section>
  );
}

export default function AdminPage({ onNavChange, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
  const tabs = buildAdminTabs(onNavChange);
  return (
    <>
      <AppPage onBack={onBack} backPlacement="above" width="xl" header={false}>
        <ReportingHero />
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      </AppPage>
      <BackToTop />
    </>
  );
}
