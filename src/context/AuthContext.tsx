import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as authService from "@/services/authService";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange((s, u) => {
      setSession(s);
      setUser(u);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      signIn: async (email, password) => {
        await authService.signInWithPassword(email, password);
      },
      signUp: async (email, password) => {
        const data = await authService.signUpWithPassword(email, password);
        return { needsEmailConfirmation: !data.session };
      },
      signOut: async () => {
        await authService.signOut();
      },
    }),
    [user, session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
