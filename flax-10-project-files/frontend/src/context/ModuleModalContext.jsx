import { createContext, useContext, useState, useCallback } from "react";
import { getModules, getModuleDetails } from "../api/moduleApi";

const ModuleModalContext = createContext(null);

export function ModuleModalProvider({ children }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openModuleModal = useCallback(async (moduleIdOrCode) => {
    if (!moduleIdOrCode) return;
    setError(null);
    setLoading(true);
    setModule(null);
    try {
      const id = String(moduleIdOrCode).trim();
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        const m = await getModuleDetails(id);
        setModule(m);
      } else {
        const list = await getModules();
        const match = list.find(
          (m) => (m.module_code || "").toLowerCase() === id.toLowerCase()
        );
        if (match) {
          const full = await getModuleDetails(match.id);
          setModule(full);
        } else {
          setError("Module not found");
        }
      }
    } catch (err) {
      setError(err.message || "Could not load module");
    } finally {
      setLoading(false);
    }
  }, []);

  const closeModuleModal = useCallback(() => {
    setModule(null);
    setError(null);
  }, []);

  return (
    <ModuleModalContext.Provider
      value={{
        module,
        loading,
        error,
        openModuleModal,
        closeModuleModal,
        isOpen: !!module || loading || !!error,
      }}
    >
      {children}
    </ModuleModalContext.Provider>
  );
}

export function useModuleModal() {
  const ctx = useContext(ModuleModalContext);
  if (!ctx) {
    throw new Error("useModuleModal must be used within ModuleModalProvider");
  }
  return ctx;
}
