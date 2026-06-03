interface Props {
  poidsInitial: number;
  poidsActuel: number;
  poidsCible: number;
}

function progressPercent(initial: number, current: number, target: number): number {
  if (initial === target) {
    return current === target ? 100 : 0;
  }
  if (target < initial) {
    const total = initial - target;
    const done = initial - current;
    return Math.min(100, Math.max(0, (done / total) * 100));
  }
  const total = target - initial;
  const done = current - initial;
  return Math.min(100, Math.max(0, (done / total) * 100));
}

export function WeightGoalGauge({ poidsInitial, poidsActuel, poidsCible }: Props) {
  const pct = progressPercent(poidsInitial, poidsActuel, poidsCible);
  const isLoss = poidsCible < poidsInitial;

  return (
    <div className="goal-gauge">
      <div className="goal-gauge__labels">
        <span>
          Départ : <strong>{poidsInitial.toLocaleString("fr-FR")} kg</strong>
        </span>
        <span>
          Actuel : <strong>{poidsActuel.toLocaleString("fr-FR")} kg</strong>
        </span>
        <span>
          Cible : <strong>{poidsCible.toLocaleString("fr-FR")} kg</strong>
        </span>
      </div>
      <div className="goal-gauge__track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="goal-gauge__fill" style={{ width: `${pct}%` }} />
        <div className="goal-gauge__marker" style={{ left: `${pct}%` }} title="Poids actuel" />
      </div>
      <p className="goal-gauge__hint">
        {isLoss ? "Progression vers la perte de poids" : "Progression vers la prise de poids"} —{" "}
        {Math.round(pct)} % du parcours
      </p>
    </div>
  );
}
