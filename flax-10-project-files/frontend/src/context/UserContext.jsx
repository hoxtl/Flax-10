import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

function getInitialUser() {
  return {
    name: "Jane",
    email: "jane@kcl.ac.uk",
    year: "Year 2",
    major: "CS"
  };
}

export function UserProvider({ children }) {
  const [user] = useState(getInitialUser());
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}