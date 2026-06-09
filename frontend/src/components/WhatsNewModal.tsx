import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resolveTrackedFields, whatsNewToggles } from "../hooks/useTrackedFields";
import {
  fieldsFromToggles,
  toggleIdsFromFields,
  TRACKING_CATALOG_VERSION,
} from "../lib/trackingCatalog";

interface WhatsNewModalProps {
  onDismiss: () => void;
}

export function WhatsNewModal({ onDismiss }: WhatsNewModalProps) {
  const { user, updateProfile } = useAuth();
  const newToggles = useMemo(() => whatsNewToggles(user), [user]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(newToggles.map((t) => t.id)));
  const [saving, setSaving] = useState(false);

  async function dismissOnly() {
    setSaving(true);
    try {
      await updateProfile({ catalog_version_seen: TRACKING_CATALOG_VERSION });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
      onDismiss();
    }
  }

  async function enableSelected() {
    if (!user) {
      onDismiss();
      return;
    }
    setSaving(true);
    try {
      const currentIds = toggleIdsFromFields(resolveTrackedFields(user));
      for (const t of newToggles) {
        if (selected.has(t.id)) currentIds.add(t.id);
      }
      await updateProfile({
        tracked_fields: fieldsFromToggles(currentIds),
        catalog_version_seen: TRACKING_CATALOG_VERSION,
      });
      onDismiss();
    } catch {
      onDismiss();
    } finally {
      setSaving(false);
    }
  }

  if (newToggles.length === 0) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card" role="dialog" aria-labelledby="whats-new-title">
        <h2 id="whats-new-title">Nouveaux indicateurs</h2>
        <p className="card-intro">
          De nouveaux champs sont disponibles dans le catalogue de suivi. Souhaitez-vous les activer ?
        </p>
        <ul className="whats-new-list">
          {newToggles.map((t) => (
            <li key={t.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => {
                    const next = new Set(selected);
                    if (next.has(t.id)) next.delete(t.id);
                    else next.add(t.id);
                    setSelected(next);
                  }}
                />
                {t.label}
              </label>
            </li>
          ))}
        </ul>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => void dismissOnly()}>
            Plus tard
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || selected.size === 0}
            onClick={() => void enableSelected()}
          >
            {saving ? "…" : "Activer la sélection"}
          </button>
        </div>
      </div>
    </div>
  );
}
