import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookMarked, Loader2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { friendlyAuthError } from "@/services/authService";

export default function LoginPage() {
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  if (user && !authLoading) {
    const from = (location.state as { from?: string } | null)?.from ?? "/library";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationMessage(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setConfirmationMessage("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BookMarked size={28} className="text-accent" />
          <h1 className="font-display text-xl font-semibold text-ink">Athenaeum</h1>
          <p className="text-sm text-ink-muted">Your private library of the books you own.</p>
        </div>

        <div className="rounded-card border border-border bg-card p-6 shadow-subtle">
          <div className="mb-5 flex rounded-card border border-border p-0.5">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-[7px] py-1.5 text-sm font-medium transition-colors ${
                mode === "signin" ? "bg-paper-soft text-ink" : "text-ink-faint"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-[7px] py-1.5 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-paper-soft text-ink" : "text-ink-faint"
              }`}
            >
              Sign Up
            </button>
          </div>

          {confirmationMessage && (
            <p className="mb-4 rounded-card border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              {confirmationMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <FieldError>{error}</FieldError>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">Your books are private and only visible to you.</p>
      </div>
    </div>
  );
}
