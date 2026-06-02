import { FormEvent, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, todayISO } from "../lib/dates";

export function ExportPage() {
  const { token } = useAuth();
  const today = todayISO();
  const [start, setStart] = useState(daysAgoISO(30));
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onExport(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (start > end) {
      setError("La date de début doit être avant la date de fin.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.downloadPdf(token, start, end);
      setMessage("PDF téléchargé.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export impossible.");
    } finally {
      setLoading(false);
    }
  }

  function setPreset(days: number) {
    setStart(daysAgoISO(days));
    setEnd(today);
  }

  return (
    <div className="card">
      <h2>Export PDF — rapport médecin</h2>
      <p style={{ margin: "0 0 1rem", color: "var(--slate-600)", fontSize: "0.9rem" }}>
        Génère un rapport structuré (synthèse, graphique poids, tableau journalier) pour la
        période choisie.
      </p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="preset-row">
        <button type="button" className="btn-preset" onClick={() => setPreset(7)}>
          7 jours
        </button>
        <button type="button" className="btn-preset" onClick={() => setPreset(30)}>
          30 jours
        </button>
        <button type="button" className="btn-preset" onClick={() => setPreset(90)}>
          90 jours
        </button>
      </div>

      <form className="form-grid" onSubmit={onExport}>
        <div className="form-row form-row--2">
          <label className="field">
            Du
            <input
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Au
            <input
              type="date"
              value={end}
              min={start}
              max={today}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Génération…" : "Télécharger le PDF"}
        </button>
      </form>
    </div>
  );
}
