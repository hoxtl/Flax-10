import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AUTH_WRAP_STYLE, AUTH_MOTION } from "../constants";
import { ScreenWrap } from "./ScreenWrap";
import AuthPage from "../../pages/Authentication/AuthenticationPage";
import PasswordResetRequest from "../../pages/Authentication/PasswordResetRequest";
import PasswordResetConfirm from "../../pages/Authentication/PasswordResetConfirm";

function AuthRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage initialSignIn={false} />} />
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

export function AuthScreen() {
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
