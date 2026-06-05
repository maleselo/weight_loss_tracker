import type { MeasureFieldName } from "../lib/measureFields";
import { MEASURE_FIELD_LABELS } from "../lib/measureFieldLabels";

interface Props {
  fields: MeasureFieldName[];
  saving: boolean;
  onUnlockField: (field: MeasureFieldName) => void;
  onUnlockAll: () => void;
}

export function ManualOverridesPanel({ fields, saving, onUnlockField, onUnlockAll }: Props) {
  if (fields.length === 0) return null;

  return (
    <section className="override-panel" aria-live="polite">
      <div className="override-panel__header">
        <strong>Saisie manuelle active</strong>
        <p className="override-panel__intro">
          {fields.length === 1
            ? "Ce champ ne sera pas mis à jour par Health Connect."
            : "Ces champs ne seront pas mis à jour par Health Connect."}
        </p>
      </div>
      <ul className="override-panel__chips">
        {fields.map((field) => (
          <li key={field}>
            <button
              type="button"
              className="override-chip"
              disabled={saving}
              title={`Réactiver la synchronisation Health Connect pour ${MEASURE_FIELD_LABELS[field]}`}
              onClick={() => onUnlockField(field)}
            >
              <span>{MEASURE_FIELD_LABELS[field]}</span>
              <span className="override-chip__action" aria-hidden>
                Réactiver sync
              </span>
            </button>
          </li>
        ))}
      </ul>
      {fields.length > 1 && (
        <button type="button" className="btn btn-ghost override-panel__all" disabled={saving} onClick={onUnlockAll}>
          Réactiver la sync pour tous les champs
        </button>
      )}
    </section>
  );
}
