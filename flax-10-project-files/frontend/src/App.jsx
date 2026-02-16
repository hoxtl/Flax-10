import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate } from "react-router-dom";

import "./App.css";
import { APP_ROUTES } from "./lib/routes";

import WelcomeLanding from "./pages/WelcomeLanding";
import DashboardLayout from "./layout/DashboardLayout";
import AuthPage from "./pages/AuthPage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

import { getUserSettings } from "./api/userService";

import { CalendarProvider } from "./context/CalendarContext";
import { TagProvider } from "./context/TagContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationToast } from "./components/Notifications";

import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordResetConfirm from "./pages/PasswordResetConfirm";

const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

function readUser() {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

const screenAnim = {
  initial: { opacity: 0, y: 8, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const [user, setUser] = useState(() => readUser());
  const [authed, setAuthed] = useState(() => isAuthenticated());

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem(WELCOME_SEEN_KEY) !== "1";
  });

  useEffect(() => {
    const sync = () => {
      setAuthed(isAuthenticated());
      setUser(readUser());
      setShowWelcome(localStorage.getItem(WELCOME_SEEN_KEY) !== "1");
    };
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);

  useEffect(() => {
    async function loadUserTheme() {
      if (!authed) {
        setIsLoadingTheme(false);
        return;
      }
      try {
        const settings = await getUserSettings();
        setInitialTheme(settings.theme || "light");
      } catch {
        setInitialTheme("light");
      } finally {
        setIsLoadingTheme(false);
      }
    }
    loadUserTheme();
  }, [authed]);

  function handleBackFromSettings() {
    setActiveNav("home");
  }

  function handleBackFromProfile() {
    setActiveNav("home");
  }

  if (isLoadingTheme) return null;

  let screen = "app";
  if (!authed || !user) screen = "auth";
  else if (showWelcome) screen = "welcome";

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AnimatePresence mode="wait">
        {screen === "auth" && (
          <motion.div
            key="auth"
            variants={screenAnim}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28 }}
            style={{ height: "100vh" }}
          >
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/reset-password" element={<PasswordResetRequest />} />
              <Route path="/reset-password/:token" element={<PasswordResetConfirm />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </motion.div>
        )}

        {screen === "welcome" && (
          <motion.div
            key="welcome"
            variants={screenAnim}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28 }}
            style={{ height: "100vh" }}
          >
            <WelcomeLanding
              user={user}
              onExplore={() => {
                localStorage.setItem(WELCOME_SEEN_KEY, "1");
                setShowWelcome(false);
                setActiveNav("home");
              }}
              onBackToAuth={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem(WELCOME_SEEN_KEY);
                window.dispatchEvent(new Event("auth-changed"));
              }}
            />
          </motion.div>
        )}

        {screen === "app" && (
          <motion.div
            key="app"
            variants={screenAnim}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28 }}
            style={{ height: "100vh" }}
          >
            <NotificationProvider>
              <CalendarProvider>
                <TagProvider>
                  <DashboardLayout
                    activeNav={activeNav}
                    onNavChange={setActiveNav}
                    user={user}
                  >
                    {activeNav === "settings" ? (
                      <Settings user={user} onBack={handleBackFromSettings} />
                    ) : activeNav === "profile" ? (
                      <Profile user={user} onBack={handleBackFromProfile} />
                    ) : (
                      (() => {
                        const route =
                          APP_ROUTES.find((r) => r.id === activeNav) || APP_ROUTES[0];
                        let pageContent = route.element;

                        // inject user into route element props
                        if (pageContent && typeof pageContent === "object") {
                          pageContent = {
                            ...pageContent,
                            props: { ...pageContent.props, user },
                          };
                        }

                        return pageContent;
                      })()
                    )}
                  </DashboardLayout>

                  <NotificationToast />
                </TagProvider>
              </CalendarProvider>
            </NotificationProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}
