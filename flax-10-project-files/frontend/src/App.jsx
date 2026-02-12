import { useState } from 'react'
import './App.css'
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import { TagProvider } from './context/TagContext';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function getUser() {
  return {
    name: "Jane Smith",
    username: "janesmith",
    email: "jane@kcl.ac.uk",
    year: "Year 2",
    major: "CS"
  };
}

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const user = getUser();

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  function handleBackFromProfile() {
    setActiveNav("home");
  }

  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else if (activeNav === "profile") {
    pageContent = <Profile user={user} onBack={handleBackFromProfile} />;
  } else {
    const route = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;
  }

  return (
    <TagProvider>
      <CalendarProvider>
        <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
          {pageContent}
        </DashboardLayout>
      </CalendarProvider>
    </TagProvider>
  );
}