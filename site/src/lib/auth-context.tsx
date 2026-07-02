import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { clientLogin, clientSignup, clientGetMe } from "~/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; token?: string; user?: AuthUser }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string; token?: string; user?: AuthUser }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "reviewpilot_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    clientGetMe(stored)
      .then((result) => {
        if (result) {
          setUser(result);
          setToken(stored);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await clientLogin(email, password);
    if (result.ok && result.token && result.user) {
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result as any;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const result = await clientSignup(email, password, name);
    if (result.ok && result.token && result.user) {
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result as any;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}