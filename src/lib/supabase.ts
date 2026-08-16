import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in development rather than making confusing network errors
  // look like a bug in the app itself.
  // eslint-disable-next-line no-console
  console.error(
    "Missing Supabase environment variables. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const SUPABASE_URL = supabaseUrl ?? "";
export const SUPABASE_PUBLISHABLE_KEY = supabaseKey ?? "";

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const BOOKS_BUCKET = "books";
export const COVERS_BUCKET = "book-covers";
