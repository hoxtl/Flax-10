import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthenticationContext";
import { ROOT_STYLE } from "./app/constants";
import { ScreenRouter } from "./app/components/ScreenRouter";
import { useAppState } from "./app/hooks/useAppState";
import { resolveScreen } from "./app/navigation/helpers";
import "./App.css";

function AppContent() {
  const state = useAppState();
  if (state.isLoadingTheme) return null;
  const screen = resolveScreen(state.authed, state.user, state.showWelcome);
  return (
    <ThemeProvider initialTheme={state.initialTheme} initialMode={state.initialMode}>
      <div style={ROOT_STYLE}>
        <AnimatePresence>
          <ScreenRouter screen={screen} state={state} />
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
