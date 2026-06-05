export type WellbeingScore = 1 | 2 | 3;

const MIN_BASELINE_DAYS = 5;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function isWellbeingScore(value: number): value is WellbeingScore {
  return value === 1 || value === 2 || value === 3;
}

function stressFromHrv(avgHrvMs: number): WellbeingScore {
  if (avgHrvMs >= 45) return 1;
  if (avgHrvMs >= 30) return 2;
  return 3;
}

function stressFromRhrDelta(delta: number): WellbeingScore {
  if (delta <= 3) return 1;
  if (delta <= 8) return 2;
  return 3;
}

export interface StressInput {
  hrvAvgMs?: number;
  restingHeartRate?: number;
  baselineMedianHr?: number;
  baselineDayCount: number;
}

/** 1 = faible, 3 = élevé. null si données insuffisantes. */
export function computeStressLevel(input: StressInput): WellbeingScore | null {
  if (input.hrvAvgMs != null && !Number.isNaN(input.hrvAvgMs) && input.hrvAvgMs > 0) {
    return stressFromHrv(input.hrvAvgMs);
  }

  if (input.restingHeartRate == null || Number.isNaN(input.restingHeartRate)) {
    return null;
  }
  if (input.baselineDayCount < MIN_BASELINE_DAYS || input.baselineMedianHr == null) {
    return null;
  }

  return stressFromRhrDelta(input.restingHeartRate - input.baselineMedianHr);
}

export interface EnergyInput {
  sleepQuality?: number;
  hrvAvgMs?: number;
  restingHeartRate?: number;
  baselineMedianHr?: number;
  baselineDayCount: number;
}

/** 1 = faible, 3 = excellent. null si pas de sommeil importé ce jour-là. */
export function computeEnergyLevel(input: EnergyInput): WellbeingScore | null {
  if (input.sleepQuality == null || !isWellbeingScore(input.sleepQuality)) {
    return null;
  }

  let energy: number = input.sleepQuality;

  if (input.hrvAvgMs != null && !Number.isNaN(input.hrvAvgMs) && input.hrvAvgMs > 0) {
    if (input.hrvAvgMs >= 55) energy = Math.min(3, energy + 1);
    else if (input.hrvAvgMs < 28) energy = Math.max(1, energy - 1);
  } else if (
    input.restingHeartRate != null &&
    !Number.isNaN(input.restingHeartRate) &&
    input.baselineDayCount >= MIN_BASELINE_DAYS &&
    input.baselineMedianHr != null
  ) {
    const delta = input.restingHeartRate - input.baselineMedianHr;
    if (delta <= -3) energy = Math.min(3, energy + 1);
    else if (delta >= 10) energy = Math.max(1, energy - 1);
  }

  return energy as WellbeingScore;
}

export function medianRestingHrBaseline(
  restingByDate: Map<string, number>,
  excludeDate: string,
): { median: number; count: number } | null {
  const values: number[] = [];
  for (const [date, hr] of restingByDate) {
    if (date !== excludeDate) values.push(hr);
  }
  if (values.length < MIN_BASELINE_DAYS) return null;
  return { median: median(values), count: values.length };
}
