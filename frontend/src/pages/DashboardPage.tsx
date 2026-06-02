import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { WeightChart } from "../components/WeightChart";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, formatDelta } from "../lib/dates";
import type { DashboardSummary, SeriesOut } from "../types";

export function DashboardPage() {
  const { token, user, updateProfile } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [series, setSeries] = useState<SeriesOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cibleInput, setCibleInput] = useState("");
  const [cibleSaving, setCibleSaving] = useState(false);
  const [cibleMessage, setCibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.poids_cible_kg != null) {
      setCibleInput(String(user.poids_cible_kg));
    } else {
      setCibleInput("");
    }
  }, [user?.poids_cible_kg]);

  useEffect(() => {
    if (!token) return;
    const start = daysAgoISO(90);
    Promise.all([
      api.dashboardSummary(token),
      api.dashboardSeries(token, "poids_kg", start),
    ])
      .then(([s, ser]) => {
        setSummary(s);
        setSeries(ser);
      })
      .catch(() => setError("Impossible de charger le tableau de bord."));
  }, [token]);

  async function onSaveCible(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCibleSaving(true);
    setCibleMessage(null);
    try {
      const value = cibleInput.trim() === "" ? null : Number(cibleInput);
      if (value != null && (!Number.isFinite(value) || value < 20 || value > 300)) {
        setCibleMessage("Le poids cible doit être entre 20 et 300 kg.");
        return;
      }
      await updateProfile({ poids_cible_kg: value });
      setCibleMessage(value != null ? "Objectif enregistré." : "Objectif supprimé.");
    } catch (err) {
      setCibleMessage(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setCibleSaving(false);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!summary) return <p className="empty">Chargement…</p>;

  const p = summary.poids_kg;
  const poidsCible = user?.poids_cible_kg ?? null;
  const reste =
    p.valeur_actuelle != null && poidsCible != null
      ? p.valeur_actuelle - poidsCible
      : null;

  return (
    <>
      <div className="card">
        <h2>Poids</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="label">Actuel</div>
            <div className="value">
              {p.valeur_actuelle != null
                ? `${p.valeur_actuelle.toLocaleString("fr-FR")} kg`
                : "—"}
            </div>
          </div>
          <div className="stat-box">
            <div className="label">Objectif</div>
            <div className="value">
              {poidsCible != null ? `${poidsCible.toLocaleString("fr-FR")} kg` : "—"}
            </div>
            {reste != null && (
              <div className="sub">
                {reste > 0
                  ? `Reste ${reste.toLocaleString("fr-FR")} kg`
                  : reste < 0
                    ? `Objectif dépassé de ${Math.abs(reste).toLocaleString("fr-FR")} kg`
                    : "Objectif atteint"}
              </div>
            )}
          </div>
          <div className="stat-box">
            <div className="label">Moyenne 7 j</div>
            <div className="value">
              {p.moyenne_mobile_7j != null
                ? `${p.moyenne_mobile_7j.toLocaleString("fr-FR")} kg`
                : "—"}
            </div>
          </div>
          <div className="stat-box">
            <div className="label">Δ 7 jours</div>
            <div className="value">{formatDelta(p.delta_7j, " kg")}</div>
          </div>
        </div>
        {p.tendance_14j_par_jour != null && (
          <p
            className="sub"
            style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--slate-600)" }}
          >
            Tendance 14 j : {formatDelta(p.tendance_14j_par_jour, " kg/j")}
          </p>
        )}

        <form className="form-grid" style={{ marginTop: "1rem" }} onSubmit={onSaveCible}>
          <label className="field">
            Poids cible (kg)
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={300}
              placeholder="Ex. 75"
              value={cibleInput}
              onChange={(e) => setCibleInput(e.target.value)}
            />
          </label>
          {cibleMessage && (
            <div
              className={
                cibleMessage.includes("impossible") || cibleMessage.includes("doit")
                  ? "alert alert-error"
                  : "alert alert-success"
              }
              style={{ marginBottom: 0 }}
            >
              {cibleMessage}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={cibleSaving}>
            {cibleSaving ? "Enregistrement…" : "Enregistrer l'objectif"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Évolution (90 jours)</h2>
        {series && <WeightChart points={series.points} poidsCible={poidsCible} />}
      </div>

      {(summary.masse_grasse_pct.valeur_actuelle != null ||
        summary.tension_sys_mmhg.valeur_actuelle != null ||
        summary.nb_pas.valeur_actuelle != null) && (
        <div className="card">
          <h2>Autres indicateurs</h2>
          <div className="stats-grid">
            {summary.masse_grasse_pct.valeur_actuelle != null && (
              <div className="stat-box">
                <div className="label">% MG</div>
                <div className="value">{summary.masse_grasse_pct.valeur_actuelle}%</div>
                <div className="sub">
                  Δ 7j : {formatDelta(summary.masse_grasse_pct.delta_7j, " %")}
                </div>
              </div>
            )}
            {summary.tension_sys_mmhg.valeur_actuelle != null && (
              <div className="stat-box">
                <div className="label">Tension</div>
                <div className="value">
                  {summary.tension_sys_mmhg.valeur_actuelle}/
                  {summary.tension_dia_mmhg.valeur_actuelle ?? "—"}
                </div>
                <div className="sub">mmHg (dernière mesure)</div>
              </div>
            )}
            {summary.nb_pas.valeur_actuelle != null && (
              <div className="stat-box">
                <div className="label">Pas</div>
                <div className="value">
                  {summary.nb_pas.valeur_actuelle.toLocaleString("fr-FR")}
                </div>
                <div className="sub">Δ 7j : {formatDelta(summary.nb_pas.delta_7j, "")}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
