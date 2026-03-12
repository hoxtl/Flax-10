import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { APP_ROUTES } from "./lib/routes";
import { getUserSettings, getUserProfile } from "./api/userService";
import { CalendarProvider } from "./context/CalendarContext";
import { TagProvider } from "./context/TagContext";
import { NotificationProvider } from "./context/NotificationContext";
import { TimerProvider } from "./context/TimerContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { TaskCompletionProvider } from "./context/TaskCompletionContext";
import { NotificationToast } from "./components/Notifications";
import AttendancePrompt from "./components/Attendance/AttendancePrompt";

import OnboardingModal from "./components/Onboarding/OnboardingModal";
import DashboardLayout from "./layout/DashboardLayout";
import WelcomeLanding from "./pages/Welcome/WelcomeLanding";
import AuthPage from "./pages/Auth/AuthPage";
import PasswordResetRequest from "./pages/Auth/PasswordResetRequest";
import PasswordResetConfirm from "./pages/Auth/PasswordResetConfirm";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import SocietyDetailPage from "./pages/Societies/SocietyDetailPage";

import "./App.css";

// Constants
const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";
const ACTIVE_NAV_KEY = "flax_active_nav";

const ROOT_STYLE = {
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
};
const DASH_WRAP_STYLE = { position: "relative", height: "100%" };
const AUTH_WRAP_STYLE = { position: "relative", height: "100vh" };
const MOTION_ABSOLUTE = { position: "absolute", inset: 0 };

const fadeAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const DASH_MOTION = {
  variants: fadeAnim,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: { duration: 0.18 },
  style: MOTION_ABSOLUTE,
};

const AUTH_MOTION = {
  variants: fadeAnim,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: { duration: 0.22 },
  style: MOTION_ABSOLUTE,
};

// Pure helpers
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

function resolveScreen(authed, user, showWelcome) {
  if (!authed || !user) return "auth";
  if (showWelcome) return "welcome";
  return "app";
}

function resolveRouteContent(activeNav, user, setActiveNav) {
  const baseNav = activeNav.split('_')[0];
  const navParam = activeNav.split('_').slice(1).join('_');
  const route = APP_ROUTES.find((r) => r.id === baseNav) || APP_ROUTES[0];
  const el = route.element;
  if (el && typeof el === "object") {
    const extraProps = { user, onNavChange: setActiveNav };
    // Pass the search param or create flag to modules view if provided
    if (baseNav === 'modules' && navParam === 'create') {
      extraProps.initialCreate = true;
    } else if (baseNav === 'modules' && navParam) {
      extraProps.initialSearch = navParam;
    }
    return { ...el, props: { ...el.props, ...extraProps } };
  }
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
  localStorage.removeItem(ACTIVE_NAV_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

// Async helpers
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

function checkOnboarding(setShowOnboarding) {
  getUserProfile()
    .then((data) => {
      if (!data?.major || data.major === "") setShowOnboarding(true);
    })
    .catch(() => { });
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
  useEffect(() => {
    loadTheme(authed, setInitialTheme, setIsLoadingTheme);
  }, [authed]);
  return { initialTheme, isLoadingTheme };
}

function readActiveNav() {
  return localStorage.getItem(ACTIVE_NAV_KEY) || "home";
}

function useAppState() {
  const [activeNav, setActiveNavState] = useState(readActiveNav);
  const [user, setUser] = useState(() => readUser());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(WELCOME_SEEN_KEY) !== "1",
  );
  useSyncAuth(setAuthed, setUser, setShowWelcome);
  const { initialTheme, isLoadingTheme } = useThemeState(authed);

  const setActiveNav = useCallback((nav) => {
    localStorage.setItem(ACTIVE_NAV_KEY, nav);
    setActiveNavState(nav);
  }, []);

  useEffect(() => {
    // Moved custom 'navigate' event listener to AppScreen where useNavigate is available
  }, []);

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

function useOnboardingCheck() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    checkOnboarding(setShowOnboarding);
  }, []);
  return [showOnboarding, setShowOnboarding];
}

// Layout wrappers
function ScreenWrap({ animKey, children }) {
  return (
    <motion.div
      key={animKey}
      variants={fadeAnim}
      initial="initial"
      animate="animate"
      exit="exit"
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
      <ConfirmProvider>
        <CalendarProvider>
          <TagProvider>
            <TimerProvider>
              <TaskCompletionProvider>
                {children}
                <NotificationToast />
                <AttendancePrompt />
              </TaskCompletionProvider>
            </TimerProvider>
          </TagProvider>
        </CalendarProvider>
      </ConfirmProvider>
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
    return <Profile user={user} onBack={() => setActiveNav("home")} onNavigate={setActiveNav} />;
  if (activeNav.startsWith("profile_"))
    return renderProfileView(activeNav, setActiveNav, user);
  return resolveRouteContent(activeNav, user, setActiveNav);
}

function renderProfileView(activeNav, setActiveNav, user) {
  const viewedUserId = activeNav.split("_")[1];
  return <Profile user={user} viewedUserId={viewedUserId} onBack={() => setActiveNav("home")} onNavigate={setActiveNav} />;
}

function AnimatedDashboardContent({ activeNav, setActiveNav, user }) {
  return (
    <div style={DASH_WRAP_STYLE}>
      <AnimatePresence>
        <motion.div key={activeNav} {...DASH_MOTION}>
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

function OnboardingWrapper({ onComplete }) {
  const [showOnboarding, setShowOnboarding] = useOnboardingCheck();
  const handleComplete = () => {
    setShowOnboarding(false);
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
  };
  return (
    <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />
  );
}

import ScrollToTop from "./components/common/ScrollToTop";

function AppScreen({ activeNav, setActiveNav, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  useSyncNavFromUrl(location.pathname, setActiveNav);

  const handleNavChange = useCallback((id) => {
    if (id.startsWith("societies_")) {
      setActiveNav("societies");
      const parts = id.split("_");
      const socId = parts[1];
      const tab = parts[2];
      const url = tab ? `/societies?id=${socId}&tab=${tab}` : `/societies?id=${socId}`;
      navigate(url);
      return;
    }

    if (id.startsWith("group-work_")) {
      const parts = id.split("_");
      const projectId = parts[1];
      const tab = parts[2];
      const url = tab ? `/group-work?project=${projectId}&tab=${tab}` : `/group-work?project=${projectId}`;
      handleNavChange(url);
      return;
    }

    if (id.startsWith('/')) {
      navigate(id);
      return;
    }

    const baseNav = id.split('?')[0];
    const route = APP_ROUTES.find((r) => r.id === baseNav);

    if (route) {
      setActiveNav(baseNav);
      const queryPart = id.includes('?') ? `?${id.split('?')[1]}` : '';
      navigate(`${route.path}${queryPart}`);
    } else {
      setActiveNav(id);
    }
  }, [navigate, setActiveNav]);

  useEffect(() => {
    const handleGlobalNavigate = (e) => handleNavChange(e.detail);
    window.addEventListener('navigate', handleGlobalNavigate);
    return () => window.removeEventListener('navigate', handleGlobalNavigate);
  }, [handleNavChange]);

  return (
    <ScreenWrap animKey="app">
      <AppProviders>
        <ScrollToTop />
        <DashboardLayout activeNav={activeNav} onNavChange={handleNavChange} user={user}>
          <AnimatedDashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
        </DashboardLayout>
        <OnboardingWrapper />
      </AppProviders>
    </ScreenWrap>
  );
}

function useSyncNavFromUrl(pathname, setActiveNav) {
  useEffect(() => {
    const path = pathname || "/";
    const route = APP_ROUTES.find((r) => r.path === path);
    if (route) setActiveNav(route.id);
  }, [pathname, setActiveNav]);
}

// Screen render
function renderScreen(screen, state) {
  const { user, authed, showWelcome, setShowWelcome, activeNav, setActiveNav } =
    state;
  if (screen === "auth") return <AuthScreen key="auth" />;
  if (screen === "welcome")
    return (
      <WelcomeScreen
        key="welcome"
        user={user}
        setShowWelcome={setShowWelcome}
        setActiveNav={setActiveNav}
      />
    );
  return (
    <AppScreen
      key="app"
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      user={user}
    />
  );
}

// Root
export default function App() {
  const state = useAppState();
  if (state.isLoadingTheme) return null;
  const screen = resolveScreen(state.authed, state.user, state.showWelcome);
  return (
    <ThemeProvider initialTheme={state.initialTheme}>
      <div style={ROOT_STYLE}>
        <AnimatePresence>{renderScreen(screen, state)}</AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
