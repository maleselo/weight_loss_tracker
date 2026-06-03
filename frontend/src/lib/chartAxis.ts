const MONTHS_SHORT_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetweenISO(start: string, end: string): number {
  const a = parseISO(start).getTime();
  const b = parseISO(end).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Libellé d’un repère X adapté à la plage affichée. */
export function formatChartAxisLabel(iso: string, spanDays: number): string {
  const d = parseISO(iso);
  const day = d.getDate();
  const month = MONTHS_SHORT_FR[d.getMonth()];
  if (spanDays <= 14) {
    return `${day} ${month}`;
  }
  if (spanDays <= 90) {
    return `${day} ${month}`;
  }
  if (spanDays <= 365) {
    return `${month} ${d.getFullYear()}`;
  }
  return String(d.getFullYear());
}

/** Indices des points à afficher sur l’axe X (évite chevauchement). */
export function pickChartTickIndices(pointCount: number, spanDays: number): number[] {
  if (pointCount <= 0) return [];
  if (pointCount === 1) return [0];

  let maxTicks = 8;
  if (spanDays <= 7) maxTicks = Math.min(pointCount, 7);
  else if (spanDays <= 30) maxTicks = 6;
  else if (spanDays <= 90) maxTicks = 5;
  else maxTicks = 4;

  if (pointCount <= maxTicks) {
    return Array.from({ length: pointCount }, (_, i) => i);
  }

  const indices: number[] = [0];
  const step = (pointCount - 1) / (maxTicks - 1);
  for (let i = 1; i < maxTicks - 1; i++) {
    indices.push(Math.round(i * step));
  }
  indices.push(pointCount - 1);
  return [...new Set(indices)].sort((a, b) => a - b);
}

export function chartSpanDays(dates: string[]): number {
  if (dates.length < 2) return dates.length === 1 ? 0 : 0;
  return daysBetweenISO(dates[0], dates[dates.length - 1]);
}
