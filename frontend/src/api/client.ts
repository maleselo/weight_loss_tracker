import type { DailyMeasurement, DashboardSummary, SeriesOut, User, UserUpdate } from "../types";

function getApiBase(): string {
  const runtime = window.__API_URL__?.trim().replace(/\/$/, "");
  if (runtime) return runtime;
  const fromEnv = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (fromEnv) return fromEnv;
  // Dev local : base vide → URLs relatives proxifiées par Vite vers :8000
  if (import.meta.env.DEV) return "";
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

  const res = await fetch(apiUrl(path), { ...init, headers });
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
  ) => {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-sante_${start}_${end}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  downloadCsv: async (token: string, start: string, end: string) => {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesures-sante_${start}_${end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export { ApiError };
