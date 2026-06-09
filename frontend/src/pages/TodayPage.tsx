import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { FieldLabelWithOverride } from "../components/FieldLabelWithOverride";
import { SleepScaleInput } from "../components/SleepScaleInput";
import { TextScaleInput } from "../components/TextScaleInput";
import { useAuth } from "../context/AuthContext";
import { formatDateFR, todayISO } from "../lib/dates";
import {
  getHealthConnectAuthorizedTypes,
  HEALTH_TODAY_SYNCED_EVENT,
  isNativeHealthAvailable,
} from "../lib/healthConnect";
import { formatFieldList } from "../lib/measureFieldLabels";
import {
  detectDirtyMeasureFields,
  fieldHasHealthPermission,
  getFieldOverrideState,
  isHealthSyncField,
  mergeManualOverrides,
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
  const [healthPermissions, setHealthPermissions] = useState<ReadonlySet<string>>(new Set());
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

        if (integration.connected && isNativeHealthAvailable()) {
          try {
            setHealthPermissions(await getHealthConnectAuthorizedTypes());
          } catch {
            setHealthPermissions(new Set());
          }
        } else {
          setHealthPermissions(new Set());
        }
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

  function canSyncField(field: MeasureFieldName) {
    return healthSyncActive && isHealthSyncField(field) && fieldHasHealthPermission(field, healthPermissions);
  }

  function showsOverrideUi(field: MeasureFieldName) {
    if (!canSyncField(field)) return false;
    const state = getFieldOverrideState(field, baselineForm, form, manualOverrides);
    return state === "manual" || state === "pending";
  }

  function fieldState(field: MeasureFieldName) {
    if (!showsOverrideUi(field)) return "sync";
    return getFieldOverrideState(field, baselineForm, form, manualOverrides);
  }

  function fieldClass(field: MeasureFieldName) {
    if (!showsOverrideUi(field)) return "";
    return overrideFieldClass(fieldState(field), syncRestoredFields.has(field));
  }

  function flashSyncRestored(fields: MeasureFieldName[]) {
    setSyncRestoredFields(new Set(fields));
    window.setTimeout(() => setSyncRestoredFields(new Set()), SYNC_RESTORE_FLASH_MS);
  }

  async function unlockFields(fields: MeasureFieldName[]) {
    const syncFields = fields.filter((f) => canSyncField(f));
    if (!token || !healthSyncActive || syncFields.length === 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const next = manualOverrides.filter((f) => !syncFields.includes(f as MeasureFieldName));
      const saved = await api.upsertMeasure(token, date, { manual_overrides: next });
      setManualOverrides(saved.manual_overrides ?? []);
      flashSyncRestored(syncFields);
      setMessage(
        syncFields.length === 1
          ? `Sync Health Connect réactivée pour ${formatFieldList(syncFields)}. La prochaine synchronisation pourra mettre à jour ce champ.`
          : `Sync Health Connect réactivée pour : ${formatFieldList(syncFields)}. La prochaine synchronisation pourra mettre à jour ces champs.`,
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
      const dirty = detectDirtyMeasureFields(baselineForm, form).filter((f) => canSyncField(f));
      const overrides = healthSyncActive
        ? mergeManualOverrides(manualOverrides, dirty)
        : manualOverrides;
      const saved = await api.upsertMeasure(token, date, measureToPayload(form, overrides));
      const { id: _, date: __, manual_overrides, ...rest } = saved;
      setForm(rest);
      setBaselineForm(rest);
      setManualOverrides(manual_overrides ?? []);
      if (dirty.length > 0) {
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

  const resume = (field: MeasureFieldName) => () => unlockFields([field]);

  return (
    <>
      <div className="card">
        <h2>{isToday ? "Aujourd'hui" : formatDateFR(date)}</h2>
        <p className="card-intro">Saisie rapide — les champs sont optionnels.</p>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

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
                showOverride={showsOverrideUi("poids_kg")}
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
                  showOverride={showsOverrideUi("masse_grasse_pct")}
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
              <label className="field">
                <span className="field-label-row">Tour de taille (cm)</span>
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
                  showOverride={showsOverrideUi("fc_repos_bpm")}
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
                showOverride={showsOverrideUi("nb_pas")}
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
                  showOverride={showsOverrideUi("tension_sys_mmhg")}
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
                  showOverride={showsOverrideUi("tension_dia_mmhg")}
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
              showOverride={showsOverrideUi("sommeil")}
              overrideState={fieldState("sommeil")}
              syncRestored={syncRestoredFields.has("sommeil")}
              onResumeSync={resume("sommeil")}
              resumeDisabled={saving}
              onChange={(v) => setForm((f) => ({ ...f, sommeil: v }))}
            />
            <TextScaleInput
              label="Niveau de stress"
              showOverride={showsOverrideUi("stress")}
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
              showOverride={showsOverrideUi("energie")}
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
                Repas plaisir
              </label>
            </div>

            <label className="field">
              <span className="field-label-row">Notes</span>
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
