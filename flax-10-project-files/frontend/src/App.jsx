import { useState, cloneElement } from 'react'
import './App.css'
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from './lib/routes';
import { CalendarProvider } from './context/CalendarContext';
import { TagProvider } from './context/TagContext';

export default function App() {
  const [activeNav, setActiveNav] = useState("home");
  const currentRoute = APP_ROUTES.find(r => r.id === activeNav) || APP_ROUTES[0];

  return (
    <TagProvider>
      <CalendarProvider>
        <DashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
          {currentRoute.element}
        </DashboardLayout>
      </CalendarProvider>
    </TagProvider>
  );
}