"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, Permission } from "@/types/api";
import { authApi, getStoredToken, setStoredToken, removeStoredToken, ApiError, SESSION_EXPIRED_EVENT } from "@/lib/api";
import { useRouter } from "next/navigation";
import { hasPermission as checkPermission, hasRole as checkRole, ROLE_PERMISSIONS } from "@/config/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  authError: string | null;
  retryAuth: () => void;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  hasPermission: (...permissions: Permission[]) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
  userPermissions: Permission[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authAttempt, setAuthAttempt] = useState(0);
  const retryAuth = () => { setIsLoading(true); setAuthError(null); setAuthAttempt(value => value + 1); };

  const refreshUser = async () => {
    const requestedToken = getStoredToken();
    try {
      const currentUser = await authApi.me();
      if (getStoredToken() !== requestedToken) return;
      setAuthError(null); setUser(currentUser);
    } catch (err) {
      if (getStoredToken() !== requestedToken && getStoredToken() !== null) return;
      if (err instanceof ApiError && err.status === 401) {
        removeStoredToken(); setToken(null); setUser(null);
      } else {
        setAuthError("Unable to check your session. Please try again.");
        throw err;
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const currentUser = await authApi.me();
          if (cancelled || getStoredToken() !== storedToken) return;
          setAuthError(null); setUser(currentUser);
        } catch (err) {
          if (cancelled || (getStoredToken() !== storedToken && getStoredToken() !== null)) return;
          if (err instanceof ApiError && err.status === 401) {
            removeStoredToken(); setToken(null); setUser(null);
          } else {
            setAuthError("Unable to check your session. Please try again.");
          }
        }
      } else {
        setToken(null); setUser(null);
      }
      if (!cancelled) setIsLoading(false);
    };

    initAuth();
    return () => { cancelled = true; };
  }, [authAttempt]);


  useEffect(() => {
    const expireSession = () => {
      setToken(null); setUser(null); setAuthError(null); setIsLoading(false);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    const syncSession = (event: StorageEvent) => { if (event.key === "token") retryAuth(); };
    window.addEventListener("storage", syncSession);
    return () => { window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession); window.removeEventListener("storage", syncSession); };
  }, []);

  const login = async (newToken: string) => {
    setStoredToken(newToken);
    setToken(newToken);
    try {
      const currentUser = await authApi.me();
      if (getStoredToken() !== newToken) return;
      setAuthError(null); setUser(currentUser); setIsLoading(false);
      router.push("/dashboard");
    } catch (err) {
      if (getStoredToken() !== newToken && getStoredToken() !== null) return;
      if (err instanceof ApiError && err.status === 401) {
        removeStoredToken(); setToken(null); setUser(null);
      }
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null); setAuthError(null); setIsLoading(false);
    router.push("/landing");
  };

  const hasPermission = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    return checkPermission(user.role, ...permissions);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return checkRole(user.role, ...roles);
  };

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        authError,
        retryAuth,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
        userPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

