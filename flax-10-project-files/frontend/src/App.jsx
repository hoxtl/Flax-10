import { useState, cloneElement } from 'react'
import './App.css'
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from "./features/calendar/context/CalendarContext";

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const currentRoute = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];

  return (
    <CalendarProvider>
      <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
        {currentRoute.element}
      </DashboardLayout>
    </CalendarProvider>
  );
}