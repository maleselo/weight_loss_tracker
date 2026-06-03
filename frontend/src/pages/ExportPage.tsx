import { FormEvent, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, todayISO } from "../lib/dates";

export function ExportPage() {
  const { token } = useAuth();
  const today = todayISO();
  const [start, setStart] = useState(daysAgoISO(30));
  const [end, setEnd] = useState(today);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [includeChart, setIncludeChart] = useState(true);
  const [includeTable, setIncludeTable] = useState(true);
  const [includeContext, setIncludeContext] = useState(true);

  async function onExportPdf(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (start > end) {
      setError("La date de début doit être avant la date de fin.");
      return;
    }
    if (!includeChart && !includeTable && !includeContext) {
      setError("Sélectionnez au moins une section pour le rapport PDF.");
      return;
    }
    setLoadingPdf(true);
    setError(null);
    setMessage(null);
    try {
      await api.downloadPdf(token, start, end, {
        includeChart,
        includeTable,
        includeContext,
      });
      setMessage("PDF téléchargé.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export impossible.");
    } finally {
      setLoadingPdf(false);
    }
  }

  async function onExportCsv() {
    if (!token) return;
    if (start > end) {
      setError("La date de début doit être avant la date de fin.");
      return;
    }
    setLoadingCsv(true);
    setError(null);
    setMessage(null);
    try {
      await api.downloadCsv(token, start, end);
      setMessage("CSV téléchargé.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export CSV impossible.");
    } finally {
      setLoadingCsv(false);
    }
  }

  function setPreset(days: number) {
    setStart(daysAgoISO(days));
    setEnd(today);
  }

  return (
    <div className="card">
      <h2>Export — rapport & données</h2>
      <p className="card-intro">
        Génère un rapport PDF personnalisable ou exporte l&apos;historique en CSV (Excel français).
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

      <form className="form-grid" onSubmit={onExportPdf}>
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

        <fieldset className="export-options">
          <legend>Options du rapport PDF</legend>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={includeChart}
              onChange={(e) => setIncludeChart(e.target.checked)}
            />
            Inclure le graphique d&apos;évolution du poids
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={includeTable}
              onChange={(e) => setIncludeTable(e.target.checked)}
            />
            Inclure le tableau détaillé des mesures (Poids, Tension, Pas…)
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
            />
            Inclure les indicateurs de contexte (Entraînement, Alcool, Notes…)
          </label>
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={loadingPdf}>
          {loadingPdf ? "Génération…" : "Télécharger le PDF"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={loadingCsv}
          onClick={onExportCsv}
        >
          {loadingCsv ? "Export…" : "Exporter au format CSV"}
        </button>
      </form>
    </div>
  );
}
