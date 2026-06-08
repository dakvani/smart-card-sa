import { useEffect, useRef, useState } from "react";
import { Loader2, Link2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateUrl } from "@/lib/link-validation";

interface OgPreview {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  favicon: string;
}

interface LinkOgPreviewProps {
  url: string;
  fallbackTitle?: string;
}

// Simple in-memory cache so retyping the same URL is instant and we don't
// hammer the edge function while the user adjusts other fields.
const previewCache = new Map<string, OgPreview | { error: string }>();

export function LinkOgPreview({ url, fallbackTitle }: LinkOgPreviewProps) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; data: OgPreview }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [imgError, setImgError] = useState(false);
  const lastRequested = useRef<string>("");

  useEffect(() => {
    const trimmed = (url || "").trim();
    if (!trimmed) {
      setState({ status: "idle" });
      return;
    }
    const valid = validateUrl(trimmed);
    if (!valid.valid) {
      setState({ status: "idle" });
      return;
    }

    const normalized = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    const cached = previewCache.get(normalized);
    if (cached) {
      if ("error" in cached) {
        setState({ status: "error", message: cached.error });
      } else {
        setImgError(false);
        setState({ status: "ready", data: cached });
      }
      return;
    }

    const handle = window.setTimeout(async () => {
      lastRequested.current = normalized;
      setState({ status: "loading" });
      setImgError(false);
      try {
        const { data, error } = await supabase.functions.invoke("link-preview", {
          body: { url: normalized },
        });
        if (lastRequested.current !== normalized) return;
        if (error) {
          previewCache.set(normalized, { error: error.message });
          setState({ status: "error", message: error.message });
          return;
        }
        if (data?.error) {
          previewCache.set(normalized, { error: data.error });
          setState({ status: "error", message: data.error });
          return;
        }
        previewCache.set(normalized, data as OgPreview);
        setState({ status: "ready", data: data as OgPreview });
      } catch (e) {
        if (lastRequested.current !== normalized) return;
        const msg = (e as Error).message || "Could not load preview";
        previewCache.set(normalized, { error: msg });
        setState({ status: "error", message: msg });
      }
    }, 600);

    return () => window.clearTimeout(handle);
  }, [url]);

  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Fetching preview…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        <Link2 className="w-3.5 h-3.5" />
        Preview unavailable — link will still work.
      </div>
    );
  }

  const { data } = state;
  const displayTitle = fallbackTitle?.trim() || data.title;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div className="flex">
        {data.image && !imgError ? (
          <img
            src={data.image}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-20 w-24 flex-shrink-0 object-cover"
          />
        ) : (
          <div className="h-20 w-24 flex-shrink-0 flex items-center justify-center bg-secondary text-muted-foreground">
            <ImageOff className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {data.favicon && (
              <img
                src={data.favicon}
                alt=""
                loading="lazy"
                className="w-3 h-3 rounded-sm"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <span className="truncate">{data.siteName}</span>
          </div>
          <p className="mt-1 text-sm font-medium line-clamp-1">{displayTitle}</p>
          {data.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
