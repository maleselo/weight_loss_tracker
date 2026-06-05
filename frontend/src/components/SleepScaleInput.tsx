import { FieldOverrideStatus } from "./FieldOverrideStatus";
import type { FieldOverrideState } from "../lib/measureFields";
import { overrideFieldClass } from "../lib/measureFields";

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  overrideState?: FieldOverrideState;
  syncRestored?: boolean;
  onResumeSync?: () => void;
  resumeDisabled?: boolean;
}

const OPTIONS = [
  { value: 1, emoji: "😞", title: "Mauvais" },
  { value: 2, emoji: "😐", title: "Moyen" },
  { value: 3, emoji: "😊", title: "Bon" },
] as const;

export function SleepScaleInput({
  label,
  value,
  onChange,
  overrideState = "sync",
  syncRestored = false,
  onResumeSync,
  resumeDisabled,
}: Props) {
  return (
    <div className={`field scale-field ${overrideFieldClass(overrideState, syncRestored)}`}>
      <span className="field-label-row field-label-row--stacked">
        <span>{label}</span>
        <FieldOverrideStatus
          state={overrideState}
          onResumeSync={onResumeSync}
          disabled={resumeDisabled}
        />
      </span>
      <div className="scale-buttons scale-buttons--emoji" role="group" aria-label={label}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? "selected" : ""}
            title={opt.title}
            aria-label={`${opt.title} (${opt.value})`}
            onClick={() => onChange(value === opt.value ? null : opt.value)}
          >
            <span className="scale-emoji" aria-hidden>
              {opt.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
