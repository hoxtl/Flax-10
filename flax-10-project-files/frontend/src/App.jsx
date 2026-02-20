import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./App.css";
import { APP_ROUTES } from "./lib/routes";
import WelcomeLanding from "./pages/WelcomeLanding";
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from "./layout/DashboardLayout";
import AuthPage from "./pages/AuthPage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import { getUserSettings, getUserProfile } from "./api/userService";
import { CalendarProvider } from "./context/CalendarContext";
import { TagProvider } from "./context/TagContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationToast } from "./components/Notifications";
import { TimerProvider } from "./context/TimerContext";
import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordResetConfirm from "./pages/PasswordResetConfirm";
import OnboardingModal from "./components/Onboarding/OnboardingModal";

const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";
const fadeAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function readUser() {
  const s = localStorage.getItem("user");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function resolveRouteContent(activeNav, user) {
  const route = APP_ROUTES.find((r) => r.id === activeNav) || APP_ROUTES[0];
  const el = route.element;
  if (el && typeof el === "object")
    return { ...el, props: { ...el.props, user } };
  return el;
}

function onExplore(setShowWelcome, setActiveNav) {
  localStorage.setItem(WELCOME_SEEN_KEY, "1");
  setShowWelcome(false);
  setActiveNav("home");
}

function onBackToAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(WELCOME_SEEN_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

async function loadTheme(authed, setInitialTheme, setIsLoadingTheme) {
  if (!authed) {
    setIsLoadingTheme(false);
    return;
  }
  try {
    const s = await getUserSettings();
    setInitialTheme(s.theme || "light");
  } catch {
    setInitialTheme("light");
  } finally {
    setIsLoadingTheme(false);
  }
}

function useSyncAuth(setAuthed, setUser, setShowWelcome) {
  useEffect(() => {
    const sync = () => {
      setAuthed(isAuthenticated());
      setUser(readUser());
      setShowWelcome(localStorage.getItem(WELCOME_SEEN_KEY) !== "1");
    };
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, [setAuthed, setUser, setShowWelcome]);
}

function useAppState() {
  const [activeNav, setActiveNav] = useState("home");
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [user, setUser] = useState(() => readUser());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(WELCOME_SEEN_KEY) !== "1",
  );
  useSyncAuth(setAuthed, setUser, setShowWelcome);
  useEffect(() => {
    loadTheme(authed, setInitialTheme, setIsLoadingTheme);
  }, [authed]);
  return {
    activeNav,
    setActiveNav,
    initialTheme,
    isLoadingTheme,
    user,
    authed,
    showWelcome,
    setShowWelcome,
  };
}

function ScreenWrap({ animKey, children }) {
  return (
    <motion.div
      key={animKey}
      variants={fadeAnim}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      style={{ position: "absolute", inset: 0 }}
    >
      {children}
    </motion.div>
  );
}

function AuthRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/reset-password" element={<PasswordResetRequest />} />
      <Route path="/reset-password/:token" element={<PasswordResetConfirm />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function AuthScreen() {
  const location = useLocation();
  return (
    <ScreenWrap animKey="auth">
      <div style={{ position: "relative", height: "100vh" }}>
        <AnimatePresence>
          <motion.div
            key={location.pathname}
            variants={fadeAnim}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.22 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <AuthRoutes location={location} />
          </motion.div>
        </AnimatePresence>
      </div>
    </ScreenWrap>
  );
}

function WelcomeScreen({ user, setShowWelcome, setActiveNav }) {
  return (
    <ScreenWrap animKey="welcome">
      <WelcomeLanding
        user={user}
        onExplore={() => onExplore(setShowWelcome, setActiveNav)}
        onBackToAuth={onBackToAuth}
      />
    </ScreenWrap>
  );
}

function DashboardContent({ activeNav, setActiveNav, user }) {
  if (activeNav === "settings")
    return <Settings user={user} onBack={() => setActiveNav("home")} />;
  if (activeNav === "profile")
    return <Profile user={user} onBack={() => setActiveNav("home")} />;
  return resolveRouteContent(activeNav, user);
}

function AnimatedDashboardContent({ activeNav, setActiveNav, user }) {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <AnimatePresence>
        <motion.div
          key={activeNav}
          variants={fadeAnim}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <DashboardContent
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            user={user}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AppProviders({ children }) {
  return (
    <NotificationProvider>
      <CalendarProvider>
        <TagProvider>
          <TimerProvider>
            {children}
            <NotificationToast />
          </TimerProvider>
        </TagProvider>
      </CalendarProvider>
    </NotificationProvider>
  );
}

function AppScreen({ activeNav, setActiveNav, user }) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    getUserProfile().then(data => {
      if (!data?.major || data.major === "") {
        setShowOnboarding(true);
      }
    }).catch(() => {});
  }, []);

  return (
    <ScreenWrap animKey="app">
      <AppProviders>
        <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav} user={user}>
          <AnimatedDashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
        </DashboardLayout>
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={() => {
            setShowOnboarding(false);
            window.location.reload();
          }}
        />
      </AppProviders>
    </ScreenWrap>
  );
}

function resolveScreen(authed, user, showWelcome) {
  if (!authed || !user) return "auth";
  if (showWelcome) return "welcome";
  return "app";
}

export default function App() {
  const {
    activeNav,
    setActiveNav,
    initialTheme,
    isLoadingTheme,
    user,
    authed,
    showWelcome,
    setShowWelcome,
  } = useAppState();
  if (isLoadingTheme) return null;
  const screen = resolveScreen(authed, user, showWelcome);
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <AnimatePresence>
          {screen === "auth" && <AuthScreen key="auth" />}
          {screen === "welcome" && (
            <WelcomeScreen
              key="welcome"
              user={user}
              setShowWelcome={setShowWelcome}
              setActiveNav={setActiveNav}
            />
          )}
          {screen === "app" && (
            <AppScreen
              key="app"
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              user={user}
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}