import { useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
      setConfirmingSignOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your account and preferences.</p>
      </div>

      <section className="rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-base font-medium text-ink">Account</h2>
        <p className="mt-2 text-sm text-ink-muted">Signed in as</p>
        <p className="text-sm font-medium text-ink">{user?.email}</p>
      </section>

      <section className="rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-base font-medium text-ink">Appearance</h2>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-ink-muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {theme === "dark" ? "light" : "dark"}
          </Button>
        </div>
      </section>

      <section className="rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-base font-medium text-ink">Session</h2>
        <p className="mt-2 mb-3 text-sm text-ink-muted">Sign out of Athenaeum on this device.</p>
        <Button variant="danger" size="sm" onClick={() => setConfirmingSignOut(true)}>
          <LogOut size={14} /> Sign out
        </Button>
      </section>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sign out?"
        description="You'll need to sign in again to access your library."
        confirmLabel="Sign out"
        isLoading={isSigningOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </div>
  );
}
