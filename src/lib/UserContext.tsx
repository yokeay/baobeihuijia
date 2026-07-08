"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  avatarSeed: string;
  region: string;
  phone: string;
}

interface UserContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  requireAuth: (onSuccess: () => void) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  pendingAction: (() => void) | null;
  setPendingAction: (fn: (() => void) | null) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("bbhj_token");
    const u = localStorage.getItem("bbhj_user");
    if (t && u) {
      try { setToken(t); setUser(JSON.parse(u)); } catch {}
    }
  }, []);

  const login = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("bbhj_token", t);
    localStorage.setItem("bbhj_user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bbhj_token");
    localStorage.removeItem("bbhj_user");
  }, []);

  const requireAuth = useCallback((onSuccess: () => void) => {
    const t = localStorage.getItem("bbhj_token");
    if (t) {
      onSuccess();
    } else {
      setPendingAction(() => onSuccess);
      setAuthOpen(true);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, token, login, logout, requireAuth, authOpen, setAuthOpen, pendingAction, setPendingAction }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
