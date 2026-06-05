import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { FieldLabelWithOverride } from "../components/FieldLabelWithOverride";
import { FieldOverrideStatus } from "../components/FieldOverrideStatus";
import { ManualOverridesPanel } from "../components/ManualOverridesPanel";
import { SleepScaleInput } from "../components/SleepScaleInput";
import { TextScaleInput } from "../components/TextScaleInput";
import { useAuth } from "../context/AuthContext";
import { formatDateFR, todayISO } from "../lib/dates";
import { HEALTH_TODAY_SYNCED_EVENT } from "../lib/healthConnect";
import { formatFieldList } from "../lib/measureFieldLabels";
import {
  detectDirtyMeasureFields,
  getFieldOverrideState,
  mergeManualOverrides,
  MEASURE_FIELD_NAMES,
  overrideFieldClass,
  type MeasureFieldName,
  type MeasureFormValues,
} from "../lib/measureFields";

function createEmptyForm(): MeasureFormValues {
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

function measureToPayload(m: MeasureFormValues, manualOverrides: string[]) {
  return {
    ...m,
    notes: m.notes || null,
    manual_overrides: manualOverrides,
  };
}

const SYNC_RESTORE_FLASH_MS = 2500;

export function TodayPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = todayISO();
  const date = searchParams.get("date") ?? today;
  const isToday = date === today;

  const [form, setForm] = useState<MeasureFormValues>(createEmptyForm);
  const [baselineForm, setBaselineForm] = useState<MeasureFormValues>(createEmptyForm);
  const [manualOverrides, setManualOverrides] = useState<string[]>([]);
  const [healthSyncActive, setHealthSyncActive] = useState(false);
  const [syncRestoredFields, setSyncRestoredFields] = useState<Set<string>>(new Set());
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

  const loadDay = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token) return;
      if (!opts?.silent) {
        setLoading(true);
        setMessage(null);
        setError(null);
      }

      const measurePromise = api.getMeasure(token, date).catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      });
      const integrationPromise = api.integrationStatus(token).catch(() => ({ connected: false }));

      try {
        const [measure, integration] = await Promise.all([measurePromise, integrationPromise]);
        setHealthSyncActive(integration.connected);
        if (measure) {
          const { id: _, date: __, manual_overrides, ...rest } = measure;
          setForm(rest);
          setBaselineForm(rest);
          setManualOverrides(manual_overrides ?? []);
        } else {
          const empty = createEmptyForm();
          setForm(empty);
          setBaselineForm(empty);
          setManualOverrides([]);
        }
        setSyncRestoredFields(new Set());
      } catch (e) {
        if (!opts?.silent) {
          setError(e instanceof ApiError ? e.message : "Chargement impossible.");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [token, date],
  );

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    if (!token || !isToday) return;

    function onTodaySynced() {
      loadDay({ silent: true });
    }

    window.addEventListener(HEALTH_TODAY_SYNCED_EVENT, onTodaySynced);
    return () => window.removeEventListener(HEALTH_TODAY_SYNCED_EVENT, onTodaySynced);
  }, [token, isToday, loadDay]);

  function setNum<K extends keyof MeasureFormValues>(key: K, raw: string) {
    const v = raw === "" ? null : Number(raw);
    setForm((f) => ({ ...f, [key]: Number.isFinite(v) ? v : null }));
  }

  function fieldState(field: MeasureFieldName) {
    if (!healthSyncActive) return "sync";
    return getFieldOverrideState(field, baselineForm, form, manualOverrides);
  }

  function fieldClass(field: MeasureFieldName) {
    if (!healthSyncActive) return "";
    return overrideFieldClass(fieldState(field), syncRestoredFields.has(field));
  }

  function flashSyncRestored(fields: MeasureFieldName[]) {
    setSyncRestoredFields(new Set(fields));
    window.setTimeout(() => setSyncRestoredFields(new Set()), SYNC_RESTORE_FLASH_MS);
  }

  async function unlockFields(fields: MeasureFieldName[]) {
    if (!token || !healthSyncActive || fields.length === 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const next = manualOverrides.filter((f) => !fields.includes(f as MeasureFieldName));
      const saved = await api.upsertMeasure(token, date, { manual_overrides: next });
      setManualOverrides(saved.manual_overrides ?? []);
      flashSyncRestored(fields);
      setMessage(
        fields.length === 1
          ? `Sync Health Connect réactivée pour ${formatFieldList(fields)}. La prochaine synchronisation pourra mettre à jour ce champ.`
          : `Sync Health Connect réactivée pour : ${formatFieldList(fields)}. La prochaine synchronisation pourra mettre à jour ces champs.`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const dirty = detectDirtyMeasureFields(baselineForm, form);
      const overrides = healthSyncActive
        ? mergeManualOverrides(manualOverrides, dirty)
        : manualOverrides;
      const saved = await api.upsertMeasure(token, date, measureToPayload(form, overrides));
      const { id: _, date: __, manual_overrides, ...rest } = saved;
      setForm(rest);
      setBaselineForm(rest);
      setManualOverrides(manual_overrides ?? []);
      if (healthSyncActive && dirty.length > 0) {
        setMessage(
          `Mesure enregistrée pour le ${formatDateFR(date)}. ${formatFieldList(dirty)} en saisie manuelle (non écrasé par Health Connect).`,
        );
      } else {
        setMessage(`Mesure enregistrée pour le ${formatDateFR(date)}.`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="empty">Chargement…</p>;

  const lockedFields = manualOverrides.filter((f): f is MeasureFieldName =>
    MEASURE_FIELD_NAMES.includes(f as MeasureFieldName),
  );

  const resume = (field: MeasureFieldName) => () => unlockFields([field]);

  return (
    <>
      <div className="card">
        <h2>{isToday ? "Aujourd'hui" : formatDateFR(date)}</h2>
        {healthSyncActive ? (
          <p className="card-intro card-intro--override">
            Les champs en <span className="override-legend override-legend--manual">saisie manuelle</span>{" "}
            gardent votre valeur ; Health Connect ne les écrase pas. Une{" "}
            <span className="override-legend override-legend--pending">modification non enregistrée</span> sera
            protégée après enregistrement.
          </p>
        ) : (
          <p className="card-intro">Saisie rapide — les champs sont optionnels.</p>
        )}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {healthSyncActive && (
          <ManualOverridesPanel
            fields={lockedFields}
            saving={saving}
            onUnlockField={(field) => unlockFields([field])}
            onUnlockAll={() => unlockFields(lockedFields)}
          />
        )}

        <form className="form-grid form-grid--daily" onSubmit={onSubmit}>
          <section className="form-section">
            <label className="field">
              <span className="field-label-row">Date de la mesure</span>
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
            <label className={`field ${fieldClass("poids_kg")}`}>
              <FieldLabelWithOverride
                label="Poids (kg)"
                showOverride={healthSyncActive}
                state={fieldState("poids_kg")}
                onResumeSync={resume("poids_kg")}
                disabled={saving}
              />
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
              <label className={`field ${fieldClass("masse_grasse_pct")}`}>
                <FieldLabelWithOverride
                  label="% masse grasse"
                  showOverride={healthSyncActive}
                  state={fieldState("masse_grasse_pct")}
                  onResumeSync={resume("masse_grasse_pct")}
                  disabled={saving}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.masse_grasse_pct ?? ""}
                  onChange={(e) => setNum("masse_grasse_pct", e.target.value)}
                />
              </label>
              <label className={`field ${fieldClass("tour_taille_cm")}`}>
                <FieldLabelWithOverride
                  label="Tour de taille (cm)"
                  showOverride={healthSyncActive}
                  state={fieldState("tour_taille_cm")}
                  onResumeSync={resume("tour_taille_cm")}
                  disabled={saving}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.tour_taille_cm ?? ""}
                  onChange={(e) => setNum("tour_taille_cm", e.target.value)}
                />
              </label>
              <label className={`field ${fieldClass("fc_repos_bpm")}`}>
                <FieldLabelWithOverride
                  label="FC repos (bpm)"
                  showOverride={healthSyncActive}
                  state={fieldState("fc_repos_bpm")}
                  onResumeSync={resume("fc_repos_bpm")}
                  disabled={saving}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.fc_repos_bpm ?? ""}
                  onChange={(e) => setNum("fc_repos_bpm", e.target.value)}
                />
              </label>
            </div>

            <label className={`field ${fieldClass("nb_pas")}`}>
              <FieldLabelWithOverride
                label="Nombre de pas"
                showOverride={healthSyncActive}
                state={fieldState("nb_pas")}
                onResumeSync={resume("nb_pas")}
                disabled={saving}
              />
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
              <label className={`field ${fieldClass("tension_sys_mmhg")}`}>
                <FieldLabelWithOverride
                  label="Tension SYS (mmHg)"
                  showOverride={healthSyncActive}
                  state={fieldState("tension_sys_mmhg")}
                  onResumeSync={resume("tension_sys_mmhg")}
                  disabled={saving}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.tension_sys_mmhg ?? ""}
                  onChange={(e) => setNum("tension_sys_mmhg", e.target.value)}
                />
              </label>
              <label className={`field ${fieldClass("tension_dia_mmhg")}`}>
                <FieldLabelWithOverride
                  label="Tension DIA (mmHg)"
                  showOverride={healthSyncActive}
                  state={fieldState("tension_dia_mmhg")}
                  onResumeSync={resume("tension_dia_mmhg")}
                  disabled={saving}
                />
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
              showOverride={healthSyncActive}
              overrideState={fieldState("sommeil")}
              syncRestored={syncRestoredFields.has("sommeil")}
              onResumeSync={resume("sommeil")}
              resumeDisabled={saving}
              onChange={(v) => setForm((f) => ({ ...f, sommeil: v }))}
            />
            <TextScaleInput
              label="Niveau de stress"
              showOverride={healthSyncActive}
              overrideState={fieldState("stress")}
              syncRestored={syncRestoredFields.has("stress")}
              onResumeSync={resume("stress")}
              resumeDisabled={saving}
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
              showOverride={healthSyncActive}
              overrideState={fieldState("energie")}
              syncRestored={syncRestoredFields.has("energie")}
              onResumeSync={resume("energie")}
              resumeDisabled={saving}
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
              showOverride={healthSyncActive}
              overrideState={fieldState("faim")}
              syncRestored={syncRestoredFields.has("faim")}
              onResumeSync={resume("faim")}
              resumeDisabled={saving}
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
              <label className={healthSyncActive ? fieldClass("entrainement") : undefined}>
                <input
                  type="checkbox"
                  checked={form.entrainement}
                  onChange={(e) => setForm((f) => ({ ...f, entrainement: e.target.checked }))}
                />
                {healthSyncActive ? (
                  <span className="checkbox-row__text">
                    Entraînement
                    <FieldOverrideStatus
                      state={fieldState("entrainement")}
                      onResumeSync={resume("entrainement")}
                      disabled={saving}
                    />
                  </span>
                ) : (
                  "Entraînement"
                )}
              </label>
              <label className={healthSyncActive ? fieldClass("alcool") : undefined}>
                <input
                  type="checkbox"
                  checked={form.alcool}
                  onChange={(e) => setForm((f) => ({ ...f, alcool: e.target.checked }))}
                />
                {healthSyncActive ? (
                  <span className="checkbox-row__text">
                    Alcool
                    <FieldOverrideStatus
                      state={fieldState("alcool")}
                      onResumeSync={resume("alcool")}
                      disabled={saving}
                    />
                  </span>
                ) : (
                  "Alcool"
                )}
              </label>
              <label className={healthSyncActive ? fieldClass("cheat_meal") : undefined}>
                <input
                  type="checkbox"
                  checked={form.cheat_meal}
                  onChange={(e) => setForm((f) => ({ ...f, cheat_meal: e.target.checked }))}
                />
                {healthSyncActive ? (
                  <span className="checkbox-row__text">
                    Repas plaisir
                    <FieldOverrideStatus
                      state={fieldState("cheat_meal")}
                      onResumeSync={resume("cheat_meal")}
                      disabled={saving}
                    />
                  </span>
                ) : (
                  "Repas plaisir"
                )}
              </label>
            </div>

            <label className={`field ${fieldClass("notes")}`}>
              <FieldLabelWithOverride
                label="Notes"
                showOverride={healthSyncActive}
                state={fieldState("notes")}
                onResumeSync={resume("notes")}
                disabled={saving}
              />
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Sommeil, stress, douleurs…"
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
              />
            </label>
          </section>

          <div className="form-actions-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
