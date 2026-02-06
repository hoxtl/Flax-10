import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import { APP_ROUTES } from "./lib/routes";

export default function App() {
  const location = useLocation();

  const activeNav =
    APP_ROUTES.find((r) => r.path === location.pathname)?.id || "home";

  return (
    <DashboardLayout activeNav={activeNav}>
      <Routes>
        {APP_ROUTES.map((r) => (
          <Route key={r.id} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}