import { useState, useEffect } from "react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import DashboardLayout from "./layout/DashboardLayout";
import AuthPage from "./pages/AuthPage";
import { APP_ROUTES } from "./lib/routes";
import { CalendarProvider } from "./context/CalendarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TagProvider } from "./context/TagContext";
import { NotificationToast } from "./components/Notifications";
import Settings from "./pages/Settings";
import { getUserSettings } from "./api/userService";
import WelcomeLanding from "./pages/WelcomeLanding";

const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

function getUser() {
  const userString = localStorage.getItem("user");
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }
  return null;
}

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem(WELCOME_SEEN_KEY) !== "1";
  });

  const user = getUser();

  useEffect(() => {
    async function loadUserTheme() {
      if (!isAuthenticated()) {
        setIsLoadingTheme(false);
        return;
      }

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

  if (!isAuthenticated() || !user) {
    return <AuthPage />;
  }

  if (isLoadingTheme) {
    return null;
  }

  if (showWelcome) {
    return (
      <ThemeProvider initialTheme={initialTheme}>
        <WelcomeLanding
          user={user}
          onExplore={() => {
            localStorage.setItem(WELCOME_SEEN_KEY, "1");
            setShowWelcome(false);
          }}
        />
      </ThemeProvider>
    );
  }

  let pageContent;
  if (activeNav === "settings") {
    pageContent = <Settings user={user} onBack={handleBackFromSettings} />;
  } else {
    const route = APP_ROUTES.find((r) => r.id === activeNav) || APP_ROUTES[0];
    pageContent = route.element;

    if (pageContent && typeof pageContent === "object") {
      pageContent = { ...pageContent, props: { ...pageContent.props, user } };
    }
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <NotificationProvider>
        <CalendarProvider>
          <TagProvider>
            <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav} user={user}>
              {pageContent}
            </DashboardLayout>

            <NotificationToast />
          </TagProvider>
        </CalendarProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}