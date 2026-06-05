export const HEALTH_SYNC_PERIOD_OPTIONS = [7, 14, 30, 90] as const;

export type HealthSyncPeriodDays = (typeof HEALTH_SYNC_PERIOD_OPTIONS)[number];

const STORAGE_KEY = "health-sync-days";
const DEFAULT_DAYS: HealthSyncPeriodDays = 7;

export function isHealthSyncPeriodDays(value: number): value is HealthSyncPeriodDays {
  return (HEALTH_SYNC_PERIOD_OPTIONS as readonly number[]).includes(value);
}

export function getStoredHealthSyncDays(): HealthSyncPeriodDays {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DAYS;
    const days = Number.parseInt(raw, 10);
    return isHealthSyncPeriodDays(days) ? days : DEFAULT_DAYS;
  } catch {
    return DEFAULT_DAYS;
  }
}

export function storeHealthSyncDays(days: HealthSyncPeriodDays): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(days));
  } catch {
    /* quota / mode privé */
  }
}
