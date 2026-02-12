import { useState } from 'react'
import './App.css'
import DashboardLayout from "./layout/DashboardLayout";
import AuthPage from './pages/AuthPage';
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import Settings from './pages/Settings';

function getUser() {
  // First check if user is in localStorage (from auth)
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }
  
  // Return null if no user (removed dummy data fallback)
  return null;
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem('user_token');
}

import { TagProvider } from './context/TagContext';

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const user = getUser();

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  // Authentication check - if not authenticated OR no user, show auth page
  if (!isAuthenticated() || !user) {
    return <AuthPage />;
  }

  // If authenticated, show dashboard
  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else {
    const route = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;
  }

  return (
    <CalendarProvider>
      <TagProvider>
        <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
          {pageContent}
        </DashboardLayout>
      </TagProvider>
    </CalendarProvider>
  );
}