import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./App.css";
import { APP_ROUTES } from "./lib/routes";
import { getUserSettings, getUserProfile } from "./api/userService";
import { CalendarProvider } from "./context/CalendarContext";
import { TagProvider } from "./context/TagContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TimerProvider } from "./context/TimerContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationToast } from "./components/Notifications";

import OnboardingModal from "./components/Onboarding/OnboardingModal";
import DashboardLayout from "./layout/DashboardLayout";
import WelcomeLanding from "./pages/Welcome/WelcomeLanding";
import AuthPage from "./pages/Auth/AuthPage";
import PasswordResetRequest from "./pages/Auth/PasswordResetRequest";
import PasswordResetConfirm from "./pages/Auth/PasswordResetConfirm";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";

// Constants
const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

const ROOT_STYLE = { position: "relative", width: "100vw", height: "100vh", overflow: "hidden" };
const DASH_WRAP_STYLE = { position: "relative", height: "100%" };
const AUTH_WRAP_STYLE = { position: "relative", height: "100vh" };
const MOTION_ABSOLUTE = { position: "absolute", inset: 0 };

const fadeAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const DASH_MOTION = {
  variants: fadeAnim, initial: "initial", animate: "animate",
  exit: "exit", transition: { duration: 0.18 }, style: MOTION_ABSOLUTE,
};

const AUTH_MOTION = {
  variants: fadeAnim, initial: "initial", animate: "animate",
  exit: "exit", transition: { duration: 0.22 }, style: MOTION_ABSOLUTE,
};

// Pure helpers
function readUser() {
  const s = localStorage.getItem("user");
  if (!s) return null;
  try { return JSON.parse(s); }
  catch { return null; }
}

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function resolveScreen(authed, user, showWelcome) {
  if (!authed || !user) return "auth";
  if (showWelcome) return "welcome";
  return "app";
}

function resolveRouteContent(activeNav, user) {
  const route = APP_ROUTES.find((r) => r.id === activeNav) || APP_ROUTES[0];
  const el = route.element;
  if (el && typeof el === "object") return { ...el, props: { ...el.props, user } };
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

// Async helpers
async function loadTheme(authed, setInitialTheme, setIsLoadingTheme) {
  if (!authed) { setIsLoadingTheme(false); return; }
  try {
    const s = await getUserSettings();
    setInitialTheme(s.theme || "light");
  } catch { setInitialTheme("light"); }
  finally { setIsLoadingTheme(false); }
}

function checkOnboarding(setShowOnboarding) {
  getUserProfile()
    .then(data => { if (!data?.major || data.major === "") setShowOnboarding(true); })
    .catch(() => {});
}

// Custom hooks
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

function useThemeState(authed) {
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  useEffect(() => { loadTheme(authed, setInitialTheme, setIsLoadingTheme); }, [authed]);
  return { initialTheme, isLoadingTheme };
}

function useAppState() {
  const [activeNav, setActiveNav] = useState("home");
  const [user, setUser] = useState(() => readUser());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem(WELCOME_SEEN_KEY) !== "1");
  useSyncAuth(setAuthed, setUser, setShowWelcome);
  const { initialTheme, isLoadingTheme } = useThemeState(authed);
  return { activeNav, setActiveNav, initialTheme, isLoadingTheme, user, authed, showWelcome, setShowWelcome };
}

function useOnboardingCheck() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => { checkOnboarding(setShowOnboarding); }, []);
  return [showOnboarding, setShowOnboarding];
}

// Layout wrappers
function ScreenWrap({ animKey, children }) {
  return (
    <motion.div
      key={animKey}
      variants={fadeAnim}
      initial="initial" animate="animate" exit="exit"
      transition={{ duration: 0.25 }}
      style={ROOT_STYLE}
    >
      {children}
    </motion.div>
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

// Route components
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

function AnimatedAuthRoutes({ location }) {
  return (
    <motion.div key={location.pathname} {...AUTH_MOTION}>
      <AuthRoutes location={location} />
    </motion.div>
  );
}

function AuthScreen() {
  const location = useLocation();
  return (
    <ScreenWrap animKey="auth">
      <div style={AUTH_WRAP_STYLE}>
        <AnimatePresence>
          <AnimatedAuthRoutes location={location} />
        </AnimatePresence>
      </div>
    </ScreenWrap>
  );
}

// Screen components
function WelcomeScreen({ user, setShowWelcome, setActiveNav }) {
  return (
    <ScreenWrap animKey="welcome">
      <WelcomeLanding user={user} onExplore={() => onExplore(setShowWelcome, setActiveNav)} onBackToAuth={onBackToAuth} />
    </ScreenWrap>
  );
}

function DashboardContent({ activeNav, setActiveNav, user }) {
  if (activeNav === "settings") return <Settings user={user} onBack={() => setActiveNav("home")} />;
  if (activeNav === "profile") return <Profile user={user} onBack={() => setActiveNav("home")} />;
  return resolveRouteContent(activeNav, user);
}

function AnimatedDashboardContent({ activeNav, setActiveNav, user }) {
  return (
    <div style={DASH_WRAP_STYLE}>
      <AnimatePresence>
        <motion.div key={activeNav} {...DASH_MOTION}>
          <DashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OnboardingWrapper({ onComplete }) {
  const [showOnboarding, setShowOnboarding] = useOnboardingCheck();
  const handleComplete = () => { setShowOnboarding(false); window.location.reload(); };
  return <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />;
}

function AppScreen({ activeNav, setActiveNav, user }) {
  return (
    <ScreenWrap animKey="app">
      <AppProviders>
        <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav} user={user}>
          <AnimatedDashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
        </DashboardLayout>
        <OnboardingWrapper />
      </AppProviders>
    </ScreenWrap>
  );
}

// Screen render
function renderScreen(screen, state) {
  const { user, authed, showWelcome, setShowWelcome, activeNav, setActiveNav } = state;
  if (screen === "auth") return <AuthScreen key="auth" />;
  if (screen === "welcome") return <WelcomeScreen key="welcome" user={user} setShowWelcome={setShowWelcome} setActiveNav={setActiveNav} />;
  return <AppScreen key="app" activeNav={activeNav} setActiveNav={setActiveNav} user={user} />;
}

// Root
export default function App() {
  const state = useAppState();
  if (state.isLoadingTheme) return null;
  const screen = resolveScreen(state.authed, state.user, state.showWelcome);
  return (
    <ThemeProvider initialTheme={state.initialTheme}>
      <div style={ROOT_STYLE}>
        <AnimatePresence>
          {renderScreen(screen, state)}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}