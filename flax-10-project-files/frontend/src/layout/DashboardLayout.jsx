import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f4f7" }}>
      <Sidebar
        active={activeNav}
        onChange={onNavChange}
        collapsed={sidebarCollapsed}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar onToggle={() => setSidebarCollapsed(c => !c)} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
