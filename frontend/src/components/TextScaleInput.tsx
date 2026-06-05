import { FieldOverrideStatus } from "./FieldOverrideStatus";
import type { FieldOverrideState } from "../lib/measureFields";
import { overrideFieldClass } from "../lib/measureFields";

interface Option {
  value: number;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (v: number | null) => void;
  overrideState?: FieldOverrideState;
  syncRestored?: boolean;
  onResumeSync?: () => void;
  resumeDisabled?: boolean;
}

export function TextScaleInput({
  label,
  options,
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
      <div className="scale-buttons scale-buttons--text" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? "selected" : ""}
            onClick={() => onChange(value === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
