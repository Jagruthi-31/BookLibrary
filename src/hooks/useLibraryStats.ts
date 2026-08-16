import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLibraryStats } from "@/services/booksService";

export interface LibraryStats {
  total: number;
  reading: number;
  finished: number;
  favorites: number;
}

export function useLibraryStats(refreshKey?: unknown) {
  const { user } = useAuth();
  const [stats, setStats] = useState<LibraryStats | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    getLibraryStats(user.id)
      .then((s) => mounted && setStats(s))
      .catch(() => mounted && setStats(null));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  return stats;
}
