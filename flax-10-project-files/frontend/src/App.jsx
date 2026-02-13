import { useState } from 'react'
import './App.css'
import DashboardLayout from "./layout/DashboardLayout";
import AuthPage from './pages/AuthPage';
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import { NotificationProvider } from './context/NotificationContext';
import Settings from './pages/Settings';

function getUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }
  
  return null;
}

function isAuthenticated() {
  return !!localStorage.getItem('user_token');
}

import { TagProvider } from './context/TagContext';
import { NotificationToast } from './components/Notifications';

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const user = getUser();

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  if (!isAuthenticated() || !user) {
    return <AuthPage />;
  }

  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else {
    const route = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;
  }

  return (
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
  );
}