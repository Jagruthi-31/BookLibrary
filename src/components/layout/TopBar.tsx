import { BookMarked, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { DropdownMenu, MenuItem, MenuDivider } from "@/components/ui/DropdownMenu";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-paper px-4 sm:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <BookMarked size={19} className="text-accent" />
        <span className="font-display text-base font-semibold text-ink">Athenaeum</span>
      </div>
      <div className="hidden lg:block" />

      <DropdownMenu
        trigger={
          <button
            aria-label="Account menu"
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
          >
            {initial}
          </button>
        }
      >
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
        </div>
        <MenuItem
          icon={theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          onClick={toggleTheme}
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<LogOut size={14} />} destructive onClick={handleSignOut}>
          Sign out
        </MenuItem>
      </DropdownMenu>
    </header>
  );
}
