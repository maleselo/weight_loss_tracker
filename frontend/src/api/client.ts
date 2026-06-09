import { Capacitor } from "@capacitor/core";
import type {
  DailyMeasurement,
  DashboardSummary,
  HealthSyncRecordInput,
  IntegrationStatus,
  IntegrationSyncResult,
  SeriesOut,
  User,
  UserUpdate,
} from "../types";
import { saveExportedFile } from "../lib/saveExportedFile";

/** Fallback APK si le build CI n’embarque pas VITE_API_URL (production Railway). */
const DEFAULT_NATIVE_API_URL = "https://api-production-63ae.up.railway.app";

function getApiBase(): string {
  const runtime = window.__API_URL__?.trim().replace(/\/$/, "");
  if (runtime) return runtime;
  const fromEnv = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (fromEnv) return fromEnv;
  // Dev local : base vide → URLs relatives proxifiées par Vite vers :8000
  if (import.meta.env.DEV) return "";
  if (Capacitor.isNativePlatform()) return DEFAULT_NATIVE_API_URL;
  return "";
}

const API_BASE = getApiBase();

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  if (!API_BASE && import.meta.env.PROD) {
    throw new ApiError(
      0,
      "API non configurée : définir VITE_API_URL sur le service web Railway (URL de l’API, sans slash final).",
    );
  }

  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body instanceof URLSearchParams) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  } else if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Connexion impossible — vérifiez votre réseau ou réinstallez la dernière version de l'application Android.",
    );
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail ?? (typeof data === "string" ? data : detail);
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg ?? d).join(", ");
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, String(detail));
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      res.status,
      "Réponse invalide du serveur — vérifiez VITE_API_URL (doit pointer vers l’API, pas le frontend).",
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string, taille_cm?: number) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, taille_cm: taille_cm ?? null }),
    }),

  login: (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    return request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body,
    });
  },

  forgotPassword: (email: string) =>
    request<{ message: string; debug_reset_url?: string | null }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  me: (token: string) => request<User>("/api/auth/me", { token }),

  updateMe: (token: string, data: UserUpdate) =>
    request<User>("/api/auth/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    }),

  getMeasure: (token: string, date: string) =>
    request<DailyMeasurement>(`/api/measures/${date}`, { token }),

  upsertMeasure: (token: string, date: string, data: Record<string, unknown>) =>
    request<DailyMeasurement>(`/api/measures/${date}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    }),

  deleteMeasure: (token: string, date: string) =>
    request<void>(`/api/measures/${date}`, { method: "DELETE", token }),

  listMeasures: (token: string, start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const q = params.toString();
    return request<DailyMeasurement[]>(`/api/measures${q ? `?${q}` : ""}`, { token });
  },

  dashboardSummary: (token: string) =>
    request<DashboardSummary>("/api/dashboard/summary", { token }),

  dashboardSeries: (token: string, metrique: string, start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const q = params.toString();
    return request<SeriesOut>(`/api/dashboard/series/${metrique}${q ? `?${q}` : ""}`, { token });
  },

  downloadPdf: async (
    token: string,
    start: string,
    end: string,
    options: {
      includeChart?: boolean;
      includeTable?: boolean;
      includeContext?: boolean;
    } = {},
  ): Promise<"downloaded" | "shared"> => {
    const params = new URLSearchParams({ start, end });
    params.set("include_chart", String(options.includeChart ?? true));
    params.set("include_table", String(options.includeTable ?? true));
    params.set("include_context", String(options.includeContext ?? true));
    const res = await fetch(apiUrl(`/api/export/pdf?${params}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = await res.json();
        detail = data.detail ?? detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, String(detail));
    }
    const blob = await res.blob();
    return saveExportedFile(blob, `rapport-sante_${start}_${end}.pdf`);
  },

  downloadCsv: async (token: string, start: string, end: string): Promise<"downloaded" | "shared"> => {
    const params = new URLSearchParams({ start, end });
    const res = await fetch(apiUrl(`/api/export/csv?${params}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = await res.json();
        detail = data.detail ?? detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, String(detail));
    }
    const blob = await res.blob();
    return saveExportedFile(blob, `mesures-sante_${start}_${end}.csv`);
  },

  integrationStatus: (token: string) =>
    request<IntegrationStatus>("/api/integrations/status", { token }),

  connectHealthConnect: (token: string) =>
    request<IntegrationStatus>("/api/integrations/health-connect/connect", {
      method: "POST",
      token,
    }),

  disconnectHealthConnect: (token: string) =>
    request<IntegrationStatus>("/api/integrations/health-connect", {
      method: "DELETE",
      token,
    }),

  syncHealthConnect: (token: string, records: HealthSyncRecordInput[]) =>
    request<IntegrationSyncResult>("/api/integrations/health-connect/sync", {
      method: "POST",
      token,
      body: JSON.stringify({ records }),
    }),
};

export { ApiError };
