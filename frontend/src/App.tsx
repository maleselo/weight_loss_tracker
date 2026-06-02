import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ExportPage } from "./pages/ExportPage";
import { TodayPage } from "./pages/TodayPage";

function Protected({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <p className="empty">Chargement…</p>;
  if (!token) return <Navigate to="/connexion" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<TodayPage />} />
            <Route path="tableau-de-bord" element={<DashboardPage />} />
            <Route path="historique" element={<HistoryPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
