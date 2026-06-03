import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { SleepScaleInput } from "../components/SleepScaleInput";
import { TextScaleInput } from "../components/TextScaleInput";
import { useAuth } from "../context/AuthContext";
import { formatDateFR, todayISO } from "../lib/dates";
import type { DailyMeasurement } from "../types";

type MeasureForm = Omit<DailyMeasurement, "id" | "date">;

function createEmptyForm(): MeasureForm {
  return {
    poids_kg: null,
    masse_grasse_pct: null,
    tour_taille_cm: null,
    tension_sys_mmhg: null,
    tension_dia_mmhg: null,
    fc_repos_bpm: null,
    nb_pas: null,
    sommeil: null,
    stress: null,
    energie: null,
    faim: null,
    entrainement: false,
    alcool: false,
    cheat_meal: false,
    notes: null,
  };
}

function measureToPayload(m: MeasureForm) {
  return {
    poids_kg: m.poids_kg,
    masse_grasse_pct: m.masse_grasse_pct,
    tour_taille_cm: m.tour_taille_cm,
    tension_sys_mmhg: m.tension_sys_mmhg,
    tension_dia_mmhg: m.tension_dia_mmhg,
    fc_repos_bpm: m.fc_repos_bpm,
    nb_pas: m.nb_pas,
    sommeil: m.sommeil,
    stress: m.stress,
    energie: m.energie,
    faim: m.faim,
    entrainement: m.entrainement,
    alcool: m.alcool,
    cheat_meal: m.cheat_meal,
    notes: m.notes || null,
  };
}

export function TodayPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = todayISO();
  const date = searchParams.get("date") ?? today;
  const isToday = date === today;

  const [form, setForm] = useState<MeasureForm>(createEmptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setEntryDate(newDate: string) {
    if (!newDate) return;
    if (newDate > today) return;
    if (newDate === today) {
      navigate("/", { replace: true });
    } else {
      navigate(`/?date=${newDate}`, { replace: true });
    }
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    api
      .getMeasure(token, date)
      .then((m) => {
        const { id: _, date: __, ...rest } = m;
        setForm(rest);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setForm(createEmptyForm());
        else setError(e instanceof ApiError ? e.message : "Chargement impossible.");
      })
      .finally(() => setLoading(false));
  }, [token, date]);

  function setNum<K extends keyof MeasureForm>(key: K, raw: string) {
    const v = raw === "" ? null : Number(raw);
    setForm((f) => ({ ...f, [key]: Number.isFinite(v) ? v : null }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.upsertMeasure(token, date, measureToPayload(form));
      setMessage(`Mesure enregistrée pour le ${formatDateFR(date)}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="empty">Chargement…</p>;

  return (
    <>
      <div className="card">
        <h2>{isToday ? "Aujourd'hui" : formatDateFR(date)}</h2>
        <p style={{ margin: "0 0 1rem", color: "var(--slate-600)", fontSize: "0.9rem" }}>
          Saisie rapide — les champs sont optionnels. Tu peux choisir une date passée pour
          rattraper une saisie.
        </p>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-grid form-grid--daily" onSubmit={onSubmit}>
          <section className="form-section">
          <label className="field">
            Date de la mesure
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </label>
          {!isToday && (
            <button type="button" className="btn btn-ghost" onClick={() => setEntryDate(today)}>
              Revenir à aujourd&apos;hui
            </button>
          )}
          </section>

          <section className="form-section">
          <label className="field">
            Poids (kg)
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="82,5"
              value={form.poids_kg ?? ""}
              onChange={(e) => setNum("poids_kg", e.target.value)}
            />
          </label>

          <div className="form-row form-row--3">
            <label className="field">
              % masse grasse
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.masse_grasse_pct ?? ""}
                onChange={(e) => setNum("masse_grasse_pct", e.target.value)}
              />
            </label>
            <label className="field">
              Tour de taille (cm)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.tour_taille_cm ?? ""}
                onChange={(e) => setNum("tour_taille_cm", e.target.value)}
              />
            </label>
            <label className="field">
              FC repos (bpm)
              <input
                type="number"
                inputMode="numeric"
                value={form.fc_repos_bpm ?? ""}
                onChange={(e) => setNum("fc_repos_bpm", e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            Nombre de pas
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              step={1}
              placeholder="8000"
              value={form.nb_pas ?? ""}
              onChange={(e) => setNum("nb_pas", e.target.value)}
            />
          </label>
          </section>

          <section className="form-section">
          <div className="form-row form-row--2">
            <label className="field">
              Tension SYS (mmHg)
              <input
                type="number"
                inputMode="numeric"
                value={form.tension_sys_mmhg ?? ""}
                onChange={(e) => setNum("tension_sys_mmhg", e.target.value)}
              />
            </label>
            <label className="field">
              Tension DIA (mmHg)
              <input
                type="number"
                inputMode="numeric"
                value={form.tension_dia_mmhg ?? ""}
                onChange={(e) => setNum("tension_dia_mmhg", e.target.value)}
              />
            </label>
          </div>
          </section>

          <section className="form-section form-section--wellbeing">
          <SleepScaleInput
            label="Qualité du sommeil"
            value={form.sommeil}
            onChange={(v) => setForm((f) => ({ ...f, sommeil: v }))}
          />
          <TextScaleInput
            label="Niveau de stress"
            options={[
              { value: 1, label: "Faible" },
              { value: 2, label: "Modéré" },
              { value: 3, label: "Élevé" },
            ]}
            value={form.stress}
            onChange={(v) => setForm((f) => ({ ...f, stress: v }))}
          />
          <TextScaleInput
            label="Niveau d'énergie"
            options={[
              { value: 1, label: "Faible" },
              { value: 2, label: "Normal" },
              { value: 3, label: "Excellent" },
            ]}
            value={form.energie}
            onChange={(v) => setForm((f) => ({ ...f, energie: v }))}
          />
          <TextScaleInput
            label="Niveau de faim"
            options={[
              { value: 1, label: "Nulle" },
              { value: 2, label: "Modérée" },
              { value: 3, label: "Forte" },
            ]}
            value={form.faim}
            onChange={(v) => setForm((f) => ({ ...f, faim: v }))}
          />
          </section>

          <section className="form-section">
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.entrainement}
                onChange={(e) => setForm((f) => ({ ...f, entrainement: e.target.checked }))}
              />
              Entraînement
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.alcool}
                onChange={(e) => setForm((f) => ({ ...f, alcool: e.target.checked }))}
              />
              Alcool
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.cheat_meal}
                onChange={(e) => setForm((f) => ({ ...f, cheat_meal: e.target.checked }))}
              />
              Cheat Meal
            </label>
          </div>

          <label className="field">
            Notes
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Sommeil, stress, douleurs…"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            />
          </label>
          </section>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </>
  );
}
