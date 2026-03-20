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
}

export default function AdminPage({ onNavChange, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
  return (
    <AppPage title="Admin Dashboard" subtitle="Manage users, societies and platform requests" onBack={onBack} width="xl">
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      <TabContent activeTab={activeTab}>{renderTab(activeTab, onNavChange)}</TabContent>
    </AppPage>
  );
}
