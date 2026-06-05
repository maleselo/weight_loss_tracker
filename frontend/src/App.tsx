import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ExportPage } from "./pages/ExportPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
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
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
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
            <Route path="connexions" element={<IntegrationsPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
