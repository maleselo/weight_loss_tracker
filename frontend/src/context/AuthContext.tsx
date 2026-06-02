import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../api/client";
import type { User, UserUpdate } from "../types";

const TOKEN_KEY = "health_dashboard_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, taille_cm?: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UserUpdate) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login(email.trim().toLowerCase(), password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await api.me(access_token);
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string, taille_cm?: number) => {
    await api.register(email.trim().toLowerCase(), password, taille_cm);
    await login(email, password);
  }, [login]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const me = await api.me(token);
    setUser(me);
  }, [token]);

  const updateProfile = useCallback(
    async (data: UserUpdate) => {
      if (!token) throw new Error("Non connecté");
      const me = await api.updateMe(token, data);
      setUser(me);
      return me;
    },
    [token],
  );

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser, updateProfile }),
    [user, token, loading, login, register, logout, refreshUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Une erreur est survenue.";
}
