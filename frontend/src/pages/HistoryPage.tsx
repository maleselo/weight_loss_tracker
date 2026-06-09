import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTrackedFields } from "../hooks/useTrackedFields";
import type { MeasureFieldName } from "../lib/measureFields";
import { daysAgoISO, formatDateFR } from "../lib/dates";
import type { DailyMeasurement } from "../types";

function formatSummary(m: DailyMeasurement, isTracked: (f: MeasureFieldName) => boolean): string {
  return (
    [
      isTracked("poids_kg") && m.poids_kg != null && `${m.poids_kg} kg`,
      isTracked("masse_grasse_pct") && m.masse_grasse_pct != null && `${m.masse_grasse_pct} % MG`,
      isTracked("nb_pas") && m.nb_pas != null && `${m.nb_pas.toLocaleString("fr-FR")} pas`,
      isTracked("fc_repos_bpm") && m.fc_repos_bpm != null && `${m.fc_repos_bpm} bpm repos`,
      (isTracked("tension_sys_mmhg") || isTracked("tension_dia_mmhg")) &&
        m.tension_sys_mmhg != null &&
        `${m.tension_sys_mmhg}/${m.tension_dia_mmhg} mmHg`,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

export function HistoryPage() {
  const { token } = useAuth();
  const { isTracked } = useTrackedFields();
  const [items, setItems] = useState<DailyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.listMeasures(token, daysAgoISO(365));
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(date: string, label: string) {
    if (!token) return;
    const ok = window.confirm(
      `Supprimer la mesure du ${label} ?\n\nCette action est définitive.`,
    );
    if (!ok) return;

    setError(null);
    setDeletingDate(date);
    try {
      await api.deleteMeasure(token, date);
      setItems((prev) => prev.filter((m) => m.date !== date));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible.");
    } finally {
      setDeletingDate(null);
    }
  }

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
      <p className="card-intro sub">
        Appuyez sur une date pour modifier. Utilisez la corbeille pour supprimer une entrée indésirable
        (sync erronée, doublon…).
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <ul className="history-list">
        {items.map((m) => (
          <li key={m.id} className="history-row">
            <Link to={`/?date=${m.date}`} className="history-item">
              <div>
                <strong>{formatDateFR(m.date)}</strong>
                <div className="history-item__summary">{formatSummary(m, isTracked)}</div>
              </div>
              <span className="history-item__chevron" aria-hidden>
                ›
              </span>
            </Link>
            <button
              type="button"
              className="btn-icon history-delete"
              aria-label={`Supprimer la mesure du ${formatDateFR(m.date)}`}
              disabled={deletingDate === m.date}
              onClick={() => onDelete(m.date, formatDateFR(m.date))}
            >
              {deletingDate === m.date ? "…" : "🗑"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
