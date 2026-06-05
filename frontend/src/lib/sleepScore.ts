export interface SleepStageInput {
  stage: string;
  durationMinutes: number;
}

export interface SleepSessionInput {
  durationMinutes: number;
  hasStageData?: boolean;
  stages?: SleepStageInput[];
}

const RESTORATIVE_STAGES = new Set(["deep", "rem"]);
const ASLEEP_STAGES = new Set(["deep", "rem", "light", "asleep"]);

/** Score 1–3 dérivé des données Health Connect (durée + phases si dispo). */
export function computeSleepQualityScore(session: SleepSessionInput): 1 | 2 | 3 {
  const duration = session.durationMinutes;
  if (duration <= 0 || Number.isNaN(duration)) return 2;

  const stages = session.stages ?? [];
  const hasStages = Boolean(session.hasStageData && stages.length > 0);

  if (!hasStages) {
    if (duration >= 450) return 3;
    if (duration >= 360) return 2;
    return 1;
  }

  let restorativeMin = 0;
  let asleepMin = 0;
  let awakeMin = 0;

  for (const stage of stages) {
    const mins = stage.durationMinutes ?? 0;
    if (RESTORATIVE_STAGES.has(stage.stage)) restorativeMin += mins;
    if (ASLEEP_STAGES.has(stage.stage)) asleepMin += mins;
    if (stage.stage === "awake") awakeMin += mins;
  }

  const asleepTotal = asleepMin > 0 ? asleepMin : duration;
  const restorativePct = restorativeMin / asleepTotal;
  const awakePct = awakeMin / duration;

  let score = 0;

  if (duration >= 420) score += 2;
  else if (duration >= 360) score += 1;
  else score -= 1;

  if (restorativePct >= 0.25) score += 2;
  else if (restorativePct >= 0.18) score += 1;
  else if (restorativePct < 0.12) score -= 1;

  if (awakePct <= 0.08) score += 1;
  else if (awakePct >= 0.18) score -= 1;

  if (score >= 4) return 3;
  if (score >= 1) return 2;
  return 1;
}
