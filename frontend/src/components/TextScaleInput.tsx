interface Option {
  value: number;
  label: string;
}

import { FieldLockHint } from "./FieldLockHint";

interface Props {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (v: number | null) => void;
  userLocked?: boolean;
}

export function TextScaleInput({ label, options, value, onChange, userLocked }: Props) {
  return (
    <div className="field scale-field">
      <span className="field-label-row">
        {label}
        <FieldLockHint locked={userLocked} />
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
