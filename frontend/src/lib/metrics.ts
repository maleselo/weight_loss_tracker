export function deltaWeightClass(delta: number | null): string {
  if (delta === null || delta === 0) return "";
  return delta < 0 ? "stat-value--loss" : "stat-value--gain";
}

export function isTensionAlert(sys: number | null | undefined, dia: number | null | undefined): boolean {
  if (sys != null && sys >= 140) return true;
  if (dia != null && dia >= 90) return true;
  return false;
}
