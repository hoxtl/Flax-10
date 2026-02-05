import { useEffect, useState } from "react";
import styles from "./DashboardLayout.module.css";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import WeekBar from "../components/WeekBar";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const isMobile = useIsMobile(900);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // mobile

  function handleToggleSidebar() {
    if (isMobile) setMobileSidebarOpen(v => !v);
    else setSidebarCollapsed(c => !c);
  }

  return (
    <div className={styles.root}>
      {!isMobile && (
        <Sidebar active={activeNav} onChange={onNavChange} collapsed={sidebarCollapsed} />
      )}

      {isMobile && mobileSidebarOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setMobileSidebarOpen(false)} />
          <div className={styles.drawer}>
            <Sidebar
              active={activeNav}
              onChange={(id) => {
                onNavChange?.(id);
                setMobileSidebarOpen(false);
              }}
              collapsed={false}
            />
          </div>
        </>
      )}

      <div className={styles.main}>
        <TopBar onToggle={handleToggleSidebar} onAddClick={() => {}} />
        <WeekBar date={new Date()} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

