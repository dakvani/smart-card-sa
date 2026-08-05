import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "smartcard.pwa.installPrompt.dismissedAt";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Non-intrusive PWA install prompt.
 * - Android/Chromium: uses the beforeinstallprompt event to trigger native install
 * - iOS Safari: renders a lightweight instructional banner (Share → Add to Home Screen)
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(16);
  const location = useLocation();

  // Never interrupt public profile pages (e.g. NFC tap landings): single-segment routes
  const isPublicProfileRoute =
    /^\/[^/]+$/.test(location.pathname) &&
    !["/auth", "/nfc", "/pricing", "/shop", "/cart", "/checkout", "/dashboard", "/admin", "/smartlink-bio"].includes(
      location.pathname,
    );

  // Keep the banner above any page-level fixed bottom navigation
  useEffect(() => {
    if (!visible) return;
    const measure = () => {
      const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
      const h = nav && getComputedStyle(nav).display !== "none" ? nav.offsetHeight : 0;
      setBottomOffset(h + 16);
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(id);
    };
  }, [visible, location.pathname]);

  useEffect(() => {
    // Respect recent dismissal
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari-only
      window.navigator.standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    if (ios) {
      setIsIOS(true);
      // Show iOS hint after a short delay to avoid interrupting first paint
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible || isPublicProfileRoute) return null;

  return (
    <div
      role="dialog"
      aria-label="Install SmartCard app"
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))` }}
      className="fixed inset-x-4 sm:left-auto sm:right-4 sm:w-[360px] z-30
                 rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl
                 shadow-2xl p-3 flex items-start gap-3"
    >

      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Install SmartCard</p>
        {isIOS ? (
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Tap <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> Share, then{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Add SmartCard to your home screen for one-tap access.
          </p>
        )}
        {!isIOS && (
          <Button
            size="sm"
            onClick={install}
            className="mt-2 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          >
            Install
          </Button>
        )}
      </div>
      <button
        aria-label="Dismiss install prompt"
        onClick={dismiss}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
