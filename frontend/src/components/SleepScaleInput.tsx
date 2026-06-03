interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}

const OPTIONS = [
  { value: 1, emoji: "😞", title: "Mauvais" },
  { value: 2, emoji: "😐", title: "Moyen" },
  { value: 3, emoji: "😊", title: "Bon" },
] as const;

export function SleepScaleInput({ label, value, onChange }: Props) {
  return (
    <div className="field scale-field">
      <span>{label}</span>
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
