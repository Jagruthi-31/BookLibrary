import { NavLink, useNavigate } from "react-router-dom";
import { Library, Heart, BookOpen, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/library", label: "Library", icon: Library },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/continue-reading", label: "Reading", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "focus-ring flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              isActive ? "text-accent" : "text-ink-faint"
            )
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}

      <button
        onClick={() => navigate("/books/new")}
        aria-label="Add Book"
        className="focus-ring -mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-paper shadow-raised"
      >
        <Plus size={22} />
      </button>

      {NAV_ITEMS.slice(2).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "focus-ring flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              isActive ? "text-accent" : "text-ink-faint"
            )
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
