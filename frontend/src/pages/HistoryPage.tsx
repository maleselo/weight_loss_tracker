import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, formatDateFR } from "../lib/dates";
import type { DailyMeasurement } from "../types";

export function HistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<DailyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .listMeasures(token, daysAgoISO(365))
      .then(setItems)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="empty">Chargement…</p>;

  if (items.length === 0) {
    return (
      <div className="card empty">
        <p>Aucune mesure enregistrée.</p>
        <Link to="/">Saisir aujourd&apos;hui</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Historique</h2>
      <ul className="history-list">
        {items.map((m) => (
          <li key={m.id}>
            <Link to={`/?date=${m.date}`} className="history-item">
              <div>
                <strong>{formatDateFR(m.date)}</strong>
                <div style={{ fontSize: "0.85rem", color: "var(--slate-600)" }}>
                  {[
                    m.poids_kg != null && `${m.poids_kg} kg`,
                    m.nb_pas != null && `${m.nb_pas.toLocaleString("fr-FR")} pas`,
                    m.tension_sys_mmhg != null &&
                      `${m.tension_sys_mmhg}/${m.tension_dia_mmhg} mmHg`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <span aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
