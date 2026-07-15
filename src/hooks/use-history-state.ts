import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useHistoryState — value with undo/redo history.
 * `set` pushes a new entry (debounced-coalesced by ref-equality upstream).
 * `replace` mutates the current entry without pushing history.
 */
export function useHistoryState<T>(initial: T, limit = 50) {
  const [stack, setStack] = useState<T[]>([initial]);
  const [index, setIndex] = useState(0);
  const value = stack[index];

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setStack((prev) => {
      const cur = prev[index];
      const resolved = typeof next === "function" ? (next as (p: T) => T)(cur) : next;
      if (Object.is(resolved, cur)) return prev;
      const trimmed = prev.slice(0, index + 1);
      const pushed = [...trimmed, resolved];
      const overflow = Math.max(0, pushed.length - limit);
      const finalStack = overflow ? pushed.slice(overflow) : pushed;
      setIndex(finalStack.length - 1);
      return finalStack;
    });
  }, [index, limit]);

  const replace = useCallback((next: T) => {
    setStack((prev) => {
      const copy = prev.slice();
      copy[index] = next;
      return copy;
    });
  }, [index]);

  const undo = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setIndex((i) => Math.min(stack.length - 1, i + 1)), [stack.length]);
  const reset = useCallback((next: T) => { setStack([next]); setIndex(0); }, []);

  return {
    value,
    set,
    replace,
    undo,
    redo,
    reset,
    canUndo: index > 0,
    canRedo: index < stack.length - 1,
  };
}

/** Coalesce rapid keystrokes into single history entries. */
export function useDebouncedCommit<T>(
  value: T,
  commit: (v: T) => void,
  delay = 400,
) {
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(value), delay);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
}
