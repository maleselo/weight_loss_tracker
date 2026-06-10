import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrackingFieldToggles } from "../components/TrackingFieldToggles";
import { getAuthErrorMessage, useAuth } from "../context/AuthContext";
import { resolveTrackedFields } from "../hooks/useTrackedFields";
import {
  fieldsFromToggles,
  toggleIdsFromFields,
  TRACKING_CATALOG_VERSION,
} from "../lib/trackingCatalog";

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setSelected(toggleIdsFromFields(resolveTrackedFields(user)));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const fields = fieldsFromToggles(selected);
    if (fields.length === 0) {
      setError("Sélectionnez au moins un indicateur à suivre.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({
        tracked_fields: fields,
        catalog_version_seen: TRACKING_CATALOG_VERSION,
      });
      setMessage("Préférences enregistrées.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Paramètres de suivi</h2>
      <p className="card-intro">
        Choisissez les indicateurs affichés dans l&apos;application. Les données déjà enregistrées sont conservées
        mais masquées si vous désactivez un champ.
      </p>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <TrackingFieldToggles selected={selected} onChange={setSelected} />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>

      <p className="sub" style={{ marginTop: "1rem" }}>
        <Link to="/connexions">Connexions Health Connect</Link>
      </p>
    </div>
  );
}
