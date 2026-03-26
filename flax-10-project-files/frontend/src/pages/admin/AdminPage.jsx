<<<<<<< HEAD
/*
 * Admin dashboard entry point.
 */

import { useState } from "react";
import { ArrowUpRight, KeyRound, Shield } from "lucide-react";
import { BackToTop } from "../../components/pagination/Pagination";
import Tooltip from "../../components/common/Tooltip/Tooltip";
import Tabs from "../../components/common/Tabs/Tabs";
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
=======
/** Admin dashboard for managing users, societies, and platform requests. */
import { useState } from "react";
import AppPage from "../../components/common/AppPage/AppPage";
import { TabBar, TabContent } from "../../components/common/TabBar/TabBar";
import UsersTab from "./components/UsersTab";
import RatificationsTab from "./components/RatificationsTab";
import TeacherRequestsTab from "./components/TeacherRequestsTab";
import ReportedSocietiesTab from "./components/ReportedSocietiesTab";
import CourseChangeRequestsTab from "./components/CourseChangeRequestsTab";

const TABS = [
  { id: "users", label: "👤 Users" },
  { id: "ratifications", label: "🏛️ Ratifications" },
  { id: "teachers", label: "🎓 Teacher Requests" },
  { id: "reports", label: "🚩 Reported Societies" },
  { id: "course-changes", label: "📚 Course Change Requests" },
];

function renderTab(activeTab, onNavChange) {
  if (activeTab === "users") return <UsersTab onNavigate={onNavChange} />;
  if (activeTab === "ratifications") return <RatificationsTab />;
  if (activeTab === "teachers") return <TeacherRequestsTab onNavigate={onNavChange} />;
  if (activeTab === "reports") return <ReportedSocietiesTab />;
  if (activeTab === "course-changes") return <CourseChangeRequestsTab onNavigate={onNavChange} />;
  return null;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export default function AdminPage({ onNavChange, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
<<<<<<< HEAD
  const tabs = buildAdminTabs(onNavChange);
  return (
    <>
      <AppPage onBack={onBack} backPlacement="above" width="xl" header={false}>
        <ReportingHero />
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      </AppPage>
      <BackToTop />
    </>
=======
  return (
    <AppPage title="Admin Dashboard" subtitle="Manage users, societies and platform requests" width="xl">
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      <TabContent activeTab={activeTab}>{renderTab(activeTab, onNavChange)}</TabContent>
    </AppPage>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
