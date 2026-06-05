import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AppVersion } from "./AppVersion";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title-row">
          <h1>Tableau de bord santé</h1>
          <AppVersion />
        </div>
        <p>{user?.email}</p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            logout();
            navigate("/connexion");
          }}
        >
          Déconnexion
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navigation principale">
        <div className="bottom-nav-inner">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <span>✎</span>
            Aujourd&apos;hui
          </NavLink>
          <NavLink to="/tableau-de-bord" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <span>📈</span>
            Tableau
          </NavLink>
          <NavLink to="/historique" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <span>☰</span>
            Historique
          </NavLink>
          <NavLink to="/connexions" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <span>🔗</span>
            Connexions
          </NavLink>
          <NavLink to="/export" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <span>📄</span>
            Export
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
