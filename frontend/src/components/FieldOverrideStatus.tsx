import type { FieldOverrideState } from "../lib/measureFields";

interface Props {
  state: FieldOverrideState;
  onResumeSync?: () => void;
  disabled?: boolean;
}

export function FieldOverrideStatus({ state, onResumeSync, disabled }: Props) {
  if (state === "sync") return null;

  if (state === "pending") {
    return (
      <span
        className="override-status override-status--pending"
        title="Ce champ sera protégé contre Health Connect une fois enregistré"
      >
        Modification non enregistrée
      </span>
    );
  }

  return (
    <span className="override-status override-status--manual">
      <span className="override-status__label" title="Valeur saisie par vous — Health Connect ne l'écrasera pas">
        Saisie manuelle
      </span>
      {onResumeSync && (
        <button
          type="button"
          className="override-status__resume"
          disabled={disabled}
          onClick={onResumeSync}
        >
          Réactiver sync
        </button>
      )}
    </span>
  );
}
