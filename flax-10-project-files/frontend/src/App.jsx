import { useState } from 'react'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'; 
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import { NotificationProvider } from './context/NotificationContext';
import Settings from './pages/Settings';

function getUser() {
  return {
    name: "Jane Smith",
    email: "jane@kcl.ac.uk",
    year: "Year 2",
    major: "CS",
    theme: "light"
  };
}

import { TagProvider } from './context/TagContext';
import { NotificationToast } from './components/Notifications';

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const user = getUser();

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else {
    const route = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <CalendarProvider>
          <TagProvider>
            <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
              {pageContent}
            </DashboardLayout>
            <NotificationToast />
          </TagProvider>
        </CalendarProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}