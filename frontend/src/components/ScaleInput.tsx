const LABELS: Record<string, [string, string, string]> = {
  sommeil: ["Mauvais", "Moyen", "Excellent"],
  stress: ["Faible", "Moyen", "Élevé"],
  energie: ["Faible", "Moyen", "Élevée"],
  faim: ["Faible", "Moyen", "Forte"],
};

interface Props {
  label: string;
  name: keyof typeof LABELS;
  value: number | null;
  onChange: (v: number | null) => void;
}

export function ScaleInput({ label, name, value, onChange }: Props) {
  return (
    <div className="field scale-field">
      <span>{label}</span>
      <div className="scale-buttons" role="group" aria-label={label}>
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? "selected" : ""}
            title={LABELS[name][n - 1]}
            onClick={() => onChange(value === n ? null : n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
