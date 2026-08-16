import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

export function friendlyAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "That email or password isn't right.";
  if (lower.includes("user already registered")) return "An account with that email already exists. Try signing in instead.";
  if (lower.includes("email not confirmed")) return "Confirm your email before signing in — check your inbox.";
  if (lower.includes("password") && lower.includes("least")) return "Password must be at least 6 characters.";
  if (lower.includes("rate limit")) return "Too many attempts. Wait a moment and try again.";
  if (lower.includes("network") || lower.includes("fetch")) return "Can't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
