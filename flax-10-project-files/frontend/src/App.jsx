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
const screenAnim = {
  initial: { opacity: 0, y: 8, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

function readUser() {
  const s = localStorage.getItem("user");
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function isAuthenticated() { return !!localStorage.getItem("token"); }

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

async function loadTheme(authed, setInitialTheme, setIsLoadingTheme) {
  if (!authed) { setIsLoadingTheme(false); return; }
  try { const s = await getUserSettings(); setInitialTheme(s.theme || "light"); }
  catch { setInitialTheme("light"); }
  finally { setIsLoadingTheme(false); }
}

function useAppState() {
  const [activeNav, setActiveNav] = useState("home");
  const [initialTheme, setInitialTheme] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [user, setUser] = useState(() => readUser());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem(WELCOME_SEEN_KEY) !== "1");
  useEffect(() => {
    const sync = () => { setAuthed(isAuthenticated()); setUser(readUser()); setShowWelcome(localStorage.getItem(WELCOME_SEEN_KEY) !== "1"); };
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);
  useEffect(() => { loadTheme(authed, setInitialTheme, setIsLoadingTheme); }, [authed]);
  return { activeNav, setActiveNav, initialTheme, isLoadingTheme, user, authed, showWelcome, setShowWelcome };
}

function ScreenWrap({ animKey, children }) {
  return (
    <motion.div key={animKey} variants={screenAnim} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.28 }} style={{ height: "100vh" }}>
      {children}
    </motion.div>
  );
}

function AuthScreen() {
  return (
    <ScreenWrap animKey="auth">
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/reset-password" element={<PasswordResetRequest />} />
        <Route path="/reset-password/:token" element={<PasswordResetConfirm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
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
  if (activeNav === "settings") return <Settings user={user} onBack={() => setActiveNav("home")} />;
  if (activeNav === "profile") return <Profile user={user} onBack={() => setActiveNav("home")} />;
  return resolveRouteContent(activeNav, user);
}

function AppScreen({ activeNav, setActiveNav, user }) {
  return (
    <ScreenWrap animKey="app">
      <NotificationProvider>
        <CalendarProvider>
          <TagProvider>
            <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav} user={user}>
              <DashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
            </DashboardLayout>
            <NotificationToast />
          </TagProvider>
        </CalendarProvider>
      </NotificationProvider>
    </ScreenWrap>);}

export default function App() {
  const { activeNav, setActiveNav, initialTheme, isLoadingTheme, user, authed, showWelcome, setShowWelcome } = useAppState();
  if (isLoadingTheme) return null;
  const screen = (!authed || !user) ? "auth" : showWelcome ? "welcome" : "app";
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AnimatePresence mode="wait">
        {screen === "auth" && <AuthScreen />}
        {screen === "welcome" && <WelcomeScreen user={user} setShowWelcome={setShowWelcome} setActiveNav={setActiveNav} />}
        {screen === "app" && <AppScreen activeNav={activeNav} setActiveNav={setActiveNav} user={user} />}
      </AnimatePresence>
    </ThemeProvider>
  );
}