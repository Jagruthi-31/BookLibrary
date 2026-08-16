import { NavLink, useNavigate } from "react-router-dom";
import { Library, Heart, BookOpen, Clock, Settings, BookMarked, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const NAV_ITEMS = [
  { to: "/library", label: "Library", icon: Library },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/continue-reading", label: "Continue Reading", icon: BookOpen },
  { to: "/recently-added", label: "Recently Added", icon: Clock },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-paper px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <BookMarked size={22} className="text-accent" />
        <span className="font-display text-lg font-semibold text-ink">Athenaeum</span>
      </div>

      <Button variant="primary" size="md" className="mb-6 w-full" onClick={() => navigate("/books/new")}>
        <Plus size={16} /> Add Book
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "focus-ring flex items-center gap-2.5 rounded-card px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-paper-soft hover:text-ink"
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            "focus-ring flex items-center gap-2.5 rounded-card px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-paper-soft hover:text-ink"
          )
        }
      >
        <Settings size={17} />
        Settings
      </NavLink>
    </aside>
  );
}
