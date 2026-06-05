import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { AndroidAppInstall } from "../components/AndroidAppInstall";
import { WeightChart } from "../components/WeightChart";
import { WeightGoalGauge } from "../components/WeightGoalGauge";
import { useAuth } from "../context/AuthContext";
import { daysAgoISO, formatDelta } from "../lib/dates";
import { deltaWeightClass, isTensionAlert } from "../lib/metrics";
import type { DashboardSummary, SeriesOut } from "../types";

type ChartRange = 7 | 30 | 90 | "all";

const RANGE_OPTIONS: { key: ChartRange; label: string }[] = [
  { key: 7, label: "7 jours" },
  { key: 30, label: "30 jours" },
  { key: 90, label: "90 jours" },
  { key: "all", label: "Tout l'historique" },
];

export function DashboardPage() {
  const { token, user, updateProfile } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [series, setSeries] = useState<SeriesOut | null>(null);
  const [allTimeSeries, setAllTimeSeries] = useState<SeriesOut | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>(90);
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

  const loadSeries = useCallback(
    (range: ChartRange) => {
      if (!token) return;
      const start = range === "all" ? undefined : daysAgoISO(range);
      api.dashboardSeries(token, "poids_kg", start).then(setSeries).catch(() => {});
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    Promise.all([api.dashboardSummary(token), api.dashboardSeries(token, "poids_kg")])
      .then(([s, allSer]) => {
        setSummary(s);
        setAllTimeSeries(allSer);
      })
      .catch(() => setError("Impossible de charger le tableau de bord."));
  }, [token]);

  useEffect(() => {
    loadSeries(chartRange);
  }, [chartRange, loadSeries]);

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

  const weightPoints = (allTimeSeries?.points ?? []).filter((pt) => pt.valeur != null);
  const poidsInitial = weightPoints.length > 0 ? weightPoints[0].valeur! : null;
  const showGauge =
    poidsInitial != null &&
    p.valeur_actuelle != null &&
    poidsCible != null &&
    poidsInitial !== poidsCible;

  const tensionAlert = isTensionAlert(
    summary.tension_sys_mmhg.valeur_actuelle,
    summary.tension_dia_mmhg.valeur_actuelle,
  );

  const chartTitle =
    chartRange === "all"
      ? "Évolution du poids — tout l'historique"
      : `Évolution du poids — ${chartRange} derniers jours`;

  return (
    <>
      <AndroidAppInstall />

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
            <div className={`value ${deltaWeightClass(p.delta_7j)}`}>
              {formatDelta(p.delta_7j, " kg")}
            </div>
          </div>
        </div>

        {showGauge && (
          <WeightGoalGauge
            poidsInitial={poidsInitial!}
            poidsActuel={p.valeur_actuelle!}
            poidsCible={poidsCible!}
          />
        )}

        {p.tendance_14j_par_jour != null && (
          <p className="sub trend-line">
            Tendance 14 j : {formatDelta(p.tendance_14j_par_jour, " kg/j")}
          </p>
        )}

        <form className="form-grid form-grid--compact" onSubmit={onSaveCible}>
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
        <div className="card-header-row">
          <h2>{chartTitle}</h2>
        </div>
        <div className="preset-row chart-range-row">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn-preset ${chartRange === opt.key ? "btn-preset--active" : ""}`}
              onClick={() => setChartRange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
              <div className={`stat-box ${tensionAlert ? "stat-box--alert" : ""}`}>
                <div className="label">
                  Tension
                  {tensionAlert && (
                    <span className="badge badge--warning" title="Pré-hypertension">
                      Attention
                    </span>
                  )}
                </div>
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
