/** Date calendaire locale au format YYYY-MM-DD (pas UTC — évite le décalage après minuit). */
export function localISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return localISODate(new Date());
}

export function formatDateFR(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, day));
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localISODate(d);
}

export function formatDelta(value: number | null, unit = ""): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${unit}`;
}
