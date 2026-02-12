import { useState, useEffect } from 'react'
import './App.css'
import { ThemeProvider } from './context/ThemeContext'; 
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import { NotificationProvider } from './context/NotificationContext';
import { TagProvider } from './context/TagContext';
import { NotificationToast } from './components/Notifications';
import Settings from './pages/Settings';
import { getUserSettings } from './api/userService';

function getUser() {
  return {
    name: "Jane Smith",
    email: "jane@kcl.ac.uk",
    year: "Year 2",
    major: "CS",
  };
}

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const user = getUser();

  // Load user's theme preference on mount
  useEffect(() => {
    async function loadUserTheme() {
      try {
        const settings = await getUserSettings();
        setInitialTheme(settings.theme || "light");
      } catch (error) {
        console.log("Using default theme (not logged in or error)");
        setInitialTheme("light");
      } finally {
        setIsLoadingTheme(false);
      }
    }
    
    loadUserTheme();
  }, []);

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  // Wait for theme to load before rendering
  if (isLoadingTheme) {
    return null; // or a loading spinner
  }

  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else {
    const route = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
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