"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCurrentUser } from "@/api/query/hooks/useAuthQueries";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Context Provider
 * Provides current user information throughout the app
 * Fetches user data client-side using React Query
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useCurrentUser();

  const refreshUser = async () => {
    await refetch();
  };

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthenticated: user !== null && !isLoading,
    isLoading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

// Export useAuth as alias for useAuthContext for backward compatibility
export { useAuthContext as useAuth };
