import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dashboard:compact-mode";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * User-selectable "Compact" dashboard mode.
 * Persists to localStorage so the choice sticks across sessions.
 */
export function useCompactMode() {
  const [compact, setCompact] = useState<boolean>(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, compact ? "1" : "0");
      // Reflect on <html> so global CSS / other components can respond too.
      document.documentElement.dataset.compact = compact ? "1" : "0";
    } catch {
      /* ignore */
    }
  }, [compact]);

  const toggle = useCallback(() => setCompact((c) => !c), []);

  return { compact, setCompact, toggle };
}
