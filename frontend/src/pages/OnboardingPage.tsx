import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppVersion } from "../components/AppVersion";
import { TrackingFieldToggles } from "../components/TrackingFieldToggles";
import { getAuthErrorMessage, useAuth } from "../context/AuthContext";
import {
  fieldsFromToggles,
  toggleIdsFromFields,
  TRACKING_CATALOG_VERSION,
  TRACKING_PRESETS,
} from "../lib/trackingCatalog";

type Step = "preset" | "customize";

export function OnboardingPage() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("preset");
  const [selected, setSelected] = useState<Set<string>>(
    () => toggleIdsFromFields(TRACKING_PRESETS.poids.fields),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(key: keyof typeof TRACKING_PRESETS) {
    setSelected(toggleIdsFromFields(TRACKING_PRESETS[key].fields));
    setStep("customize");
  }

  async function onFinish() {
    const fields = fieldsFromToggles(selected);
    if (fields.length === 0) {
      setError("Sélectionnez au moins un indicateur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        tracked_fields: fields,
        catalog_version_seen: TRACKING_CATALOG_VERSION,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <h1>Bienvenue</h1>
        <AppVersion />
      </header>

      {step === "preset" && (
        <div className="card">
          <h2>Que souhaitez-vous suivre ?</h2>
          <p className="card-intro">
            Choisissez un profil de départ. Vous pourrez affiner chaque indicateur à l&apos;étape suivante.
          </p>
          <div className="preset-cards">
            {Object.entries(TRACKING_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                className="preset-card"
                onClick={() => applyPreset(key as keyof typeof TRACKING_PRESETS)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "customize" && (
        <div className="card">
          <h2>Affinez votre suivi</h2>
          <p className="card-intro">
            Désactivez les indicateurs que vous ne souhaitez pas voir. Vous pourrez les réactiver plus tard dans
            les paramètres.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <TrackingFieldToggles selected={selected} onChange={setSelected} />
          <div className="form-actions onboarding-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep("preset")}>
              Retour
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void onFinish()}>
              {saving ? "Enregistrement…" : "Commencer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
