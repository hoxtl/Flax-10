import { createContext, useContext } from "react";

const AppNavContext = createContext(null);

export function useAppNav() {
  return useContext(AppNavContext);
}

export function AppNavProvider({ setActiveNav, children }) {
  return (
    <AppNavContext.Provider value={{ setActiveNav }}>
      {children}
    </AppNavContext.Provider>
  );
}
